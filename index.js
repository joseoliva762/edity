const inputFile = document.querySelector('.file');
const chooseImageButton = document.querySelector('.choose-image');
const previewImage = document.querySelector('.preview-image');
const filterOptions = document.querySelectorAll('.filter button');
const filterName = document.querySelector('.filter-info .name');
const filterValue = document.querySelector('.filter-info .value');
const filterSlider = document.querySelector('.slider input');
const resetButton = document.querySelector('.controls .reset-filters');
const rotateOptions = document.querySelectorAll('.rotate button');
const saveImageButton = document.querySelector('.save-image');

let filters = {
  brightness: {
    min: -100,
    max: 100,
    value: 0
  },
  saturation: {
    min: -100,
    max: 100,
    value: 0
  },
  inversion: {
    min: 0,
    max: 100,
    value: 0
  },
  grayscale: {
    min: 0,
    max: 100,
    value: 0
  }
}
localStorage.setItem('filters', JSON.stringify(filters));

let transform = {
  rotate: 0,
  flip: {
    horizontal: 1,
    vertical: 1
  }
}

const normalizeValue = (value) => value + 100;

const getFilterData = (filters) => {
  const { brightness, saturation, inversion, grayscale } = filters;
  const brightnessValue = normalizeValue(brightness.value);
  const saturationValue = normalizeValue(saturation.value);
  const { value: inversionValue } = inversion;
  const { value: grayscaleValue } = grayscale;
  const toApply = `
    brightness(${brightnessValue}%)
    saturate(${saturationValue}%)
    invert(${inversionValue}%)
    grayscale(${grayscaleValue}%)
  `;
  return {
    brightnessValue,
    saturationValue,
    inversionValue,
    grayscaleValue,
    toApply
  }
}

const getRotateData = ({ rotate, flip: { horizontal, vertical} }) => {
  const toApply = `rotate(${rotate}deg) scaleX(${horizontal}) scaleY(${vertical})`;
  return {
    rotate,
    horizontal,
    vertical,
    toApply
  }
}

const applyFilter = () => {
  const { toApply } = getFilterData(filters);
  const { toApply: rotateToApply } = getRotateData(transform);
  previewImage.style.filter = toApply,
  previewImage.style.transform = rotateToApply;
}

const onLoadFile = ({ target: { files }}) => {
  const [ file ] = files;
  if (!file) return;
  previewImage.src = URL.createObjectURL(file);
  const enableEditor = () => {
    onResetClicked();
    const container = document.querySelector('.container');
    container.classList.remove('disabled');
  }
  previewImage.addEventListener('load', enableEditor);
};

const onOptionClicked = (option) => {
  const previouslyActive = document.querySelector('.filter .active');
  previouslyActive.classList.toggle('active');
  option.classList.toggle('active');
  filterName.innerText = option.innerText;
  const { min, max, value } = filters[option.id];
  filterValue.innerText = `${value}%`;
  filterSlider.value = value;
  filterSlider.min = min;
  filterSlider.max = max;
}

const onSliderChange = ({ target: { value }}) => {
  filterValue.innerText = `${value}%`;
  const selectedFilter = document.querySelector('.filter .active').id;
  filters[selectedFilter].value = parseInt(value);
  applyFilter();
}

const onResetClicked = () => {
  const filtersInitialState = JSON.parse(localStorage.getItem('filters'));
  filters = { ...filtersInitialState };
  const inputReset =  { target: { value: 0 }};
  filterSlider.value = 0;
  transform = { rotate: 0, flip: { horizontal: 1, vertical: 1 }};
  onSliderChange(inputReset);
}

const onRotateOptionClicked = (option) => {
  const { id: optionId } = option;
  switch (optionId) {
    case 'rotate-left':
      transform.rotate -= 90;
      break;
    case 'rotate-right':
      transform.rotate += 90;
      break;
    case 'flip-horizontal':
      transform.flip.horizontal = transform.flip.horizontal === 1 ? -1 : 1;
      break;
    case 'flip-vertical':
      transform.flip.vertical = transform.flip.vertical === 1 ? -1 : 1;
      break;
  }
  applyFilter();
}

const downloadImage = (canvas) => {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'image.png';
  link.click();
}

const onSaveImage = () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = previewImage.naturalHeight;
  canvas.width = previewImage.naturalWidth;
  const { toApply: filtersToApply } = getFilterData(filters);
  const { rotate, horizontal: flipHorizontal, vertical: flipVertical } = getRotateData(transform);
  context.filter = filtersToApply;
  context.translate(canvas.width / 2, canvas.height / 2);
  rotate && context.rotate(rotate * Math.PI / 180);
  context.scale(flipHorizontal, flipVertical);
  context.drawImage(previewImage, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
  downloadImage(canvas);
}

inputFile.addEventListener('change', onLoadFile);
chooseImageButton.addEventListener('click', () => inputFile.click());
filterSlider.addEventListener('input', onSliderChange);
resetButton.addEventListener('click', onResetClicked);
saveImageButton.addEventListener('click', onSaveImage);
filterOptions
  .forEach((option) => option.addEventListener('click', () => onOptionClicked(option)));
rotateOptions
  .forEach((option) => option.addEventListener('click', () => onRotateOptionClicked(option)));
