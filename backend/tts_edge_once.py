#!/usr/bin/env python3
import argparse
import asyncio
import base64
import io
import json
import sys


def emit(payload):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.flush()


async def synthesize(text: str, voice: str) -> bytes:
    import edge_tts

    communicator = edge_tts.Communicate(text=text, voice=voice)
    audio = io.BytesIO()
    async for chunk in communicator.stream():
        if chunk.get("type") == "audio":
            audio.write(chunk["data"])
    return audio.getvalue()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--voice", required=True)
    args = parser.parse_args()

    text = (args.text or "").strip()
    voice = (args.voice or "").strip()
    if not text:
        emit({"ok": False, "error": "empty text"})
        return 1
    if not voice:
        emit({"ok": False, "error": "empty voice"})
        return 1

    try:
        audio_bytes = asyncio.run(synthesize(text, voice))
        if not audio_bytes:
            emit({"ok": False, "error": "empty audio"})
            return 1
        emit(
            {
                "ok": True,
                "content_type": "audio/mpeg",
                "audio_base64": base64.b64encode(audio_bytes).decode("ascii"),
            }
        )
        return 0
    except Exception as exc:
        emit({"ok": False, "error": f"{exc.__class__.__name__}: {exc}"})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

