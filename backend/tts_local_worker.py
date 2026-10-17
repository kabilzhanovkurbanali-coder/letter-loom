#!/usr/bin/env python3
import base64
import io
import json
import os
import sys
import traceback
import wave

INIT_ERROR = None

try:
    import torch
    from transformers import AutoTokenizer, VitsModel
except Exception as exc:  # pragma: no cover
    INIT_ERROR = str(exc)
    torch = None
    AutoTokenizer = None
    VitsModel = None


MODEL_CACHE = {}


def write_event(event):
    sys.stdout.write(json.dumps(event, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def load_model_bundle(model_id):
    cached = MODEL_CACHE.get(model_id)
    if cached:
        return cached

    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = VitsModel.from_pretrained(model_id)
    model.eval()
    bundle = (tokenizer, model)
    MODEL_CACHE[model_id] = bundle
    return bundle


def waveform_to_wav_bytes(waveform_tensor, sampling_rate):
    audio = waveform_tensor.squeeze().detach().cpu().clamp(-1.0, 1.0)
    pcm_tensor = (audio * 32767.0).to(torch.int16)
    pcm_bytes = pcm_tensor.numpy().tobytes()

    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(int(sampling_rate))
        wf.writeframes(pcm_bytes)
    return buffer.getvalue()


def synthesize(model_id, text):
    tokenizer, model = load_model_bundle(model_id)
    inputs = tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        waveform = model(**inputs).waveform
    return waveform_to_wav_bytes(waveform, model.config.sampling_rate)


def main():
    if INIT_ERROR:
        write_event(
            {
                "ok": False,
                "fatal": True,
                "error": f"Python TTS dependencies are missing: {INIT_ERROR}. Install requirements.txt in backend."
            }
        )
        return 1

    hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_API_KEY")
    if hf_token:
        os.environ["HF_TOKEN"] = hf_token

    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue

        try:
            payload = json.loads(line)
            request_id = payload.get("id")
            model_id = str(payload.get("model") or "").strip()
            text = str(payload.get("text") or "").strip()
            if not request_id:
                raise ValueError("missing request id")
            if not model_id:
                raise ValueError("missing model id")
            if not text:
                raise ValueError("empty text")

            audio_bytes = synthesize(model_id, text)
            write_event(
                {
                    "id": request_id,
                    "ok": True,
                    "content_type": "audio/wav",
                    "audio_base64": base64.b64encode(audio_bytes).decode("ascii"),
                }
            )
        except Exception as exc:  # pragma: no cover
            write_event(
                {
                    "id": payload.get("id") if isinstance(payload, dict) else None,
                    "ok": False,
                    "error": f"{exc.__class__.__name__}: {exc}",
                    "trace": traceback.format_exc(limit=1),
                }
            )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
