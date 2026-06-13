const accessibilityToggle = document.querySelector(".accessibility-toggle");
const accessibilityPanel = document.querySelector("#accessibility-panel");
const liveRegion = document.querySelector("#live-region");
const doctorsList = document.querySelector("#doctors-list");
const specialtyFilter = document.querySelector("#specialty-filter");
const appointmentSummary = document.querySelector("#appointment-summary");
const appointmentStorageKey = "medaccessAppointment";

function setLiveMessage(message) {
  if (!liveRegion) {
    return;
  }

  liveRegion.textContent = message;
}

function openAccessibilityPanel() {
  if (!accessibilityPanel || !accessibilityToggle) {
    return;
  }

  accessibilityPanel.hidden = false;
  accessibilityToggle.setAttribute("aria-expanded", "true");
  accessibilityToggle.setAttribute("aria-label", "Закрыть настройки отображения");
  setLiveMessage("Панель настроек отображения открыта.");

  const firstPanelControl = accessibilityPanel.querySelector("input, button, select, textarea, a[href]");

  if (firstPanelControl) {
    firstPanelControl.focus();
  }
}

function closeAccessibilityPanel({ returnFocus = false } = {}) {
  if (!accessibilityPanel || !accessibilityToggle) {
    return;
  }

  accessibilityPanel.hidden = true;
  accessibilityToggle.setAttribute("aria-expanded", "false");
  accessibilityToggle.setAttribute("aria-label", "Открыть настройки отображения");
  setLiveMessage("Панель настроек отображения закрыта.");

  if (returnFocus) {
    accessibilityToggle.focus();
  }
}

if (accessibilityToggle && accessibilityPanel) {
  accessibilityToggle.addEventListener("click", () => {
    if (accessibilityPanel.hidden) {
      openAccessibilityPanel();
      return;
    }

    closeAccessibilityPanel();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !accessibilityPanel.hidden) {
      closeAccessibilityPanel({ returnFocus: true });
    }
  });
}

function formatSlot(slot) {
  const [datePart, timePart] = slot.split(" ");
  const [year, month, day] = datePart.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const formattedDate = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);

  return `${formattedDate}, ${timePart}`;
}

function createParagraph(label, value) {
  const paragraph = document.createElement("p");
  const strong = document.createElement("strong");

  strong.textContent = `${label}: `;
  paragraph.append(strong, value);

  return paragraph;
}

function createDoctorCard(doctor) {
  const card = document.createElement("article");
  const content = document.createElement("div");
  const title = document.createElement("h3");
  const slots = document.createElement("details");
  const slotsSummary = document.createElement("summary");
  const slotsFieldset = document.createElement("fieldset");
  const slotsLegend = document.createElement("legend");
  const continueButton = document.createElement("button");

  card.className = "doctor-card";
  content.className = "doctor-card-content";
  slots.className = "appointment-slots";
  continueButton.type = "button";
  continueButton.textContent = "Продолжить запись";
  continueButton.disabled = true;

  title.textContent = doctor.name;
  content.append(
    title,
    createParagraph("Специальность", doctor.specialty.toLowerCase()),
    createParagraph("Стаж", doctor.experience),
    createParagraph("Кабинет", doctor.room)
  );

  slotsSummary.textContent = "Выбрать время приема";
  slotsLegend.textContent = `Свободное время у ${doctor.name}`;
  slotsFieldset.append(slotsLegend);

  doctor.slots.forEach((slot) => {
    const label = document.createElement("label");
    const input = document.createElement("input");

    input.type = "radio";
    input.name = `doctor-${doctor.id}-slot`;
    input.value = slot;

    input.addEventListener("change", () => {
      continueButton.disabled = false;
      continueButton.dataset.doctorId = String(doctor.id);
      continueButton.dataset.slot = slot;
      setLiveMessage(`Выбрано время приема: ${formatSlot(slot)}.`);
    });

    label.append(input, ` ${formatSlot(slot)}`);
    slotsFieldset.append(label);
  });

  continueButton.addEventListener("click", () => {
    const selectedSlot = continueButton.dataset.slot;

    if (!selectedSlot) {
      setLiveMessage("Выберите время приема перед продолжением записи.");
      return;
    }

    sessionStorage.setItem(appointmentStorageKey, JSON.stringify({
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      experience: doctor.experience,
      room: doctor.room,
      slot: selectedSlot
    }));

    window.location.href = "appointment.html";
  });

  slots.append(slotsSummary, slotsFieldset, continueButton);
  card.append(content, slots);

  return card;
}

function renderSpecialtyFilter(doctors) {
  if (!specialtyFilter) {
    return;
  }

  const specialties = new Map();

  doctors.forEach((doctor) => {
    specialties.set(doctor.specialtyCode, doctor.specialty);
  });

  specialties.forEach((specialty, code) => {
    const option = document.createElement("option");

    option.value = code;
    option.textContent = specialty;
    specialtyFilter.append(option);
  });
}

function renderDoctors(doctors) {
  if (!doctorsList) {
    return;
  }

  doctorsList.innerHTML = "";

  if (doctors.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.textContent = "По выбранной специальности сейчас нет доступных врачей.";
    doctorsList.append(emptyMessage);
    setLiveMessage(emptyMessage.textContent);
    return;
  }

  doctors.forEach((doctor) => {
    doctorsList.append(createDoctorCard(doctor));
  });

  setLiveMessage(`Показано врачей: ${doctors.length}.`);
}

function initDoctorsPage() {
  const doctors = window.MEDACCESS_DOCTORS || [];

  if (!doctorsList || !specialtyFilter || doctors.length === 0) {
    return;
  }

  renderSpecialtyFilter(doctors);
  renderDoctors(doctors);

  specialtyFilter.addEventListener("change", () => {
    const selectedSpecialty = specialtyFilter.value;
    const filteredDoctors = selectedSpecialty
      ? doctors.filter((doctor) => doctor.specialtyCode === selectedSpecialty)
      : doctors;

    renderDoctors(filteredDoctors);
  });
}

initDoctorsPage();

function renderAppointmentSummary() {
  if (!appointmentSummary) {
    return;
  }

  const savedAppointment = sessionStorage.getItem(appointmentStorageKey);

  appointmentSummary.innerHTML = "";

  if (!savedAppointment) {
    const message = document.createElement("p");
    const link = document.createElement("a");

    message.textContent = "Выберите врача и время приема на странице записи.";
    link.href = "doctors.html";
    link.textContent = "Перейти к выбору врача";
    appointmentSummary.append(message, link);
    setLiveMessage("Врач и время приема пока не выбраны.");
    return;
  }

  let appointment;

  try {
    appointment = JSON.parse(savedAppointment);
  } catch {
    sessionStorage.removeItem(appointmentStorageKey);
    renderAppointmentSummary();
    return;
  }
  const list = document.createElement("dl");

  [
    ["Врач", appointment.doctorName],
    ["Специальность", appointment.specialty],
    ["Стаж", appointment.experience],
    ["Кабинет", appointment.room],
    ["Дата и время", formatSlot(appointment.slot)]
  ].forEach(([termText, descriptionText]) => {
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = termText;
    description.textContent = descriptionText;
    list.append(term, description);
  });

  appointmentSummary.append(list);
  setLiveMessage(`Выбрана запись к врачу ${appointment.doctorName} на ${formatSlot(appointment.slot)}.`);
}

renderAppointmentSummary();
