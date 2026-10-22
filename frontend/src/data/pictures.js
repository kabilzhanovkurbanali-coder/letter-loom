// 3D pictures served by the backend from /images/<key>.webp (Fluent Emoji 3D, MIT license).
export const PICTURE_KEYS = new Set([
  'airplane', 'airport', 'alphabet', 'animal', 'ant', 'apple', 'aunt', 'autumn', 'baby',
  'backpack', 'bag', 'bakery', 'ball', 'balloon', 'banana', 'basket', 'bear', 'bed', 'bee',
  'berry', 'bicycle', 'bird', 'blocks', 'boat', 'book', 'boot', 'bowl', 'boy', 'bread', 'bridge',
  'brother', 'bucket', 'bus', 'butterfly', 'cactus', 'cake', 'calendar', 'camel', 'camera',
  'candle', 'car', 'carrot', 'cat', 'center', 'chair', 'cheese', 'cherry', 'chick', 'chicken',
  'childhood', 'chocolate', 'circle', 'clock', 'cloud', 'cloud_dark', 'coconut', 'computer',
  'cookie', 'corn', 'cow', 'crab', 'crown', 'cucumber', 'cup', 'desert', 'doctor', 'dog',
  'dolphin', 'door', 'dragon', 'drum', 'duck', 'eagle', 'ear', 'egg', 'elephant', 'eye', 'family',
  'finger', 'fire', 'firefly', 'fish', 'flower', 'forest', 'fork', 'fox', 'friend', 'friendship',
  'frog', 'fruit', 'garage', 'garden', 'gift', 'giraffe', 'girl', 'globe', 'goat', 'grape',
  'grass', 'grasshopper', 'guitar', 'hammer', 'hand', 'hat', 'heart', 'hedgehog', 'holiday',
  'horse', 'hospital', 'house', 'island', 'juice', 'kangaroo', 'key', 'keyboard', 'kite', 'kiwi',
  'koala', 'ladybug', 'lamp', 'leaf', 'lemon', 'leopard', 'letter', 'library', 'lion', 'lizard',
  'magpie', 'market', 'meadow', 'melon', 'milk', 'minute', 'miracle', 'mirror', 'monitor',
  'monkey', 'moon', 'mother', 'motor', 'mountain', 'mouse', 'museum', 'mushroom', 'music', 'nose',
  'notebook', 'ocean', 'octopus', 'onion', 'orange', 'owl', 'panda', 'pants', 'paper', 'pasta',
  'pea', 'peach', 'pear', 'pencil', 'penguin', 'pepper', 'phone', 'picture', 'pie', 'pig', 'pilot',
  'plane', 'plate', 'porridge', 'potato', 'pumpkin', 'rabbit', 'radio', 'rain', 'rainbow', 'river',
  'road', 'robot', 'rocket', 'rooster', 'rose', 'salad', 'school', 'scissors', 'sea', 'shadow',
  'sheep', 'ship', 'shirt', 'shop', 'sister', 'snail', 'snow', 'snowleopard', 'snowman', 'soap',
  'sock', 'sofa', 'soup', 'spider', 'spoon', 'springtime', 'squirrel', 'star', 'station',
  'strawberry', 'student', 'summer', 'sun', 'sunflower', 'sunshine', 'tambourine', 'taxi', 'tea',
  'teacher', 'teapot', 'telephone', 'television', 'tent', 'thunder', 'tiger', 'titmouse', 'tomato',
  'tongue', 'tooth', 'toy', 'tractor', 'train', 'tree', 'tulip', 'turkey', 'turtle', 'umbrella', 'unicorn',
  'valley', 'water', 'watermelon', 'whale', 'wheel', 'wind', 'window', 'winter', 'wolf', 'world',
  'yurt', 'zebra'
]);

// Level data sometimes uses numbered variants (car2, mirror2) of the same concept.
export const resolvePictureKey = (label) => {
  const key = String(label || '').replace(/\d+$/, '');
  return PICTURE_KEYS.has(key) ? key : null;
};

export const picturePath = (label) => {
  const key = resolvePictureKey(label);
  return key ? `/images/${key}.webp` : null;
};
