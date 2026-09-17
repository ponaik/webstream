export async function getAvailableMadia(url) {
  if (!url) {
    console.log("No media url");
    return [];
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Parsed JSON:", data);
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}