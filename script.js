
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
      file,
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
    alert("Ajoute une question écrite pour continuer.");
    return;
  }

  const welcome = document.getElementById("welcome");
  if (welcome) welcome.style.display = "none";

  const user = document.createElement("div");
  user.className = "message user";
  user.textContent = text;
  messages.appendChild(user);

  const bot = document.createElement("div");
  bot.className = "message bot";
  bot.textContent = "Uhq IA réfléchit... 👑";
  messages.appendChild(bot);

  selectedPhotos.forEach(photo =>
    URL.revokeObjectURL(photo.url)
  );
  selectedPhotos = [];
  updatePreview();

  input.value = "";
  messages.scrollTop = messages.scrollHeight;

  try {
    const response = await fetch(
      "/.netlify/functions/gemini",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream"
        },
        body: JSON.stringify({ message: text })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "Erreur du serveur."
      );
    }

    if (!response.body) {
      throw new Error("Flux de réponse indisponible.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let fullAnswer = "";

    bot.textContent = "";

    function processEvent(block) {
      const lines = block.split(/\r?\n/);
      const dataLines = lines
        .filter(line => line.startsWith("data:"))
        .map(line => line.slice(5).trim());

      if (!dataLines.length) return;

      const rawData = dataLines.join("\n");

      if (rawData === "[DONE]") return;

      try {
        const event = JSON.parse(rawData);

        if (
          event.event_type === "step.delta" &&
          event.delta?.type === "text"
        ) {
          fullAnswer += event.delta.text || "";
          bot.textContent = fullAnswer;
          messages.scrollTop = messages.scrollHeight;
        }

        if (event.error?.message) {
          throw new Error(event.error.message);
        }

      } catch (error) {
        if (error instanceof SyntaxError) return;
        throw error;
      }
    }

    while (true) {
      const { value, done } = await reader.read();

      buffer += decoder.decode(value || new Uint8Array(), {
        stream: !done
      });

      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        processEvent(block);
      }

      if (done) break;
    }

    if (buffer.trim()) {
      processEvent(buffer);
    }

    if (!fullAnswer.trim()) {
      throw new Error("Uhq IA n'a reçu aucune réponse.");
    }

  } catch (error) {
    console.error("UHQ IA:", error);
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

  selectedPhotos.forEach(photo =>
    URL.revokeObjectURL(photo.url)
  );

  selectedPhotos = [];
  updatePreview();
}

document.getElementById("input").addEventListener(
  "keydown",
  function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
);
