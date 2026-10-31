
let selectedPhotos = [];

function showPhoto(event) {
  const files = Array.from(event.target.files);

  files.forEach(file => {
    if (!file.type.startsWith("image/")) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Image trop volumineuse (8 Mo maximum).");
      return;
    }

    if (selectedPhotos.length >= 5) {
      alert("Maximum 5 photos.");
      return;
    }

    selectedPhotos.push({
      file: file,
      url: URL.createObjectURL(file)
    });
  });

  event.target.value = "";
  updatePreview();
}

function updatePreview() {
  const preview = document.getElementById("preview");
  if (!preview) return;

  preview.innerHTML = "";

  selectedPhotos.forEach((photo, index) => {
    const img = document.createElement("img");
    img.src = photo.url;
    img.alt = "Photo sélectionnée";
    img.style.width = "70px";
    img.style.height = "70px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "10px";

    const remove = document.createElement("button");
    remove.textContent = "×";
    remove.type = "button";
    remove.onclick = () => {
      URL.revokeObjectURL(selectedPhotos[index].url);
      selectedPhotos.splice(index, 1);
      updatePreview();
    };

    const item = document.createElement("div");
    item.appendChild(img);
    item.appendChild(remove);
    preview.appendChild(item);
  });
}

async function sendMessage() {
  const input = document.getElementById("input");
  const messages = document.getElementById("messages");
  const text = input.value.trim();

  if (!text && selectedPhotos.length === 0) return;

  if (!text && selectedPhotos.length > 0) {
    alert("L'analyse des photos arrive bientôt. Ajoute une question écrite !");
    return;
  }

  document.getElementById("welcome").style.display = "none";

  const user = document.createElement("div");
  user.className = "message user";
  user.textContent = text;
  messages.appendChild(user);

  const bot = document.createElement("div");
  bot.className = "message bot";
  bot.textContent = "Uhq IA réfléchit... 👑";
  messages.appendChild(bot);

  const photos = [...selectedPhotos];
  photos.forEach(photo => URL.revokeObjectURL(photo.url));
  selectedPhotos = [];
  updatePreview();

  input.value = "";
  messages.scrollTop = messages.scrollHeight;

  try {
    const response = await fetch("/.netlify/functions/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur du serveur");
    }

    bot.textContent = data.answer || "Je n'ai pas reçu de réponse.";

  } catch (error) {
    bot.textContent = "Erreur : " + error.message;
  }

  messages.scrollTop = messages.scrollHeight;
}

function newChat() {
  const messages = document.getElementById("messages");
  const welcome = document.getElementById("welcome");

  messages.innerHTML = "";
  if (welcome) {
    messages.appendChild(welcome);
    welcome.style.display = "block";
  }

  selectedPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
  selectedPhotos = [];
  updatePreview();
}

document.getElementById("input").addEventListener("keydown", function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});
