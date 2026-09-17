import { getAvailableMadia } from "./getAvailableMadia";
import { applyPlayerSrc } from "./video-player";

// const URL = import.meta.env.VITE_MEDIA_BASE_URL;
const URL = "https://kek.bounceme.net/media/hls/";

const selectElement = document.getElementById("directorySelect");
const selectBtn = document.getElementById("selectBtn");
const typeInput = document.getElementById('playerSrcType');

const itemsData = await getAvailableMadia(URL);

// Populate the select element from array
itemsData.forEach((item, index) => {
  const option = document.createElement("option");
  option.value = index;
  option.textContent = `${item.name}`;
//   option.textContent = `${item.name} (${item.type})`;
  selectElement.appendChild(option);
});

// Handler function receiving selected object
function handleSelection(selectedObject) {
  if (!selectedObject) {
    console.log("No option selected.");
    return;
  }
  console.log("Selected Item Object:", selectedObject);
}

// Click event listener
selectBtn.addEventListener("click", () => {
  const selectedIndex = selectElement.value;
  if (selectedIndex !== "") {
    const selectedObj = itemsData[selectedIndex];
    const selectedScr = URL + selectedObj.name;

    handleSelection(selectedObj);
    applyPlayerSrc(selectedScr, typeInput.value);
  }
});