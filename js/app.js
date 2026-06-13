const accessibilityToggle = document.querySelector(".accessibility-toggle");
const accessibilityPanel = document.querySelector("#accessibility-panel");
const liveRegion = document.querySelector("#live-region");
const doctorsList = document.querySelector("#doctors-list");
const specialtyFilter = document.querySelector("#specialty-filter");
const appointmentSummary = document.querySelector("#appointment-summary");
const patientForm = document.querySelector("#patient-form");
const patientFormErrors = document.querySelector("#patient-form-errors");
const appointmentResult = document.querySelector("#appointment-result");
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
  const formattedDate = formatDate(datePart);

  return `${formattedDate}, ${timePart}`;
}

function formatDate(datePart) {
  const [year, month, day] = datePart.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
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

function setFieldError(field, message) {
  const errorElement = document.querySelector(`#${field.id}-error`);

  field.setAttribute("aria-invalid", message ? "true" : "false");

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearPatientFormErrors() {
  if (!patientForm) {
    return;
  }

  patientForm.querySelectorAll("input, textarea").forEach((field) => {
    field.removeAttribute("aria-invalid");
  });

  patientForm.querySelectorAll(".field-error").forEach((errorElement) => {
    errorElement.textContent = "";
  });

  if (patientFormErrors) {
    patientFormErrors.textContent = "";
  }

  if (appointmentResult) {
    appointmentResult.textContent = "";
  }
}

function validatePatientForm() {
  const errors = [];

  if (!patientForm) {
    return errors;
  }

  const patientName = patientForm.elements["patient-name"];
  const patientPhone = patientForm.elements["patient-phone"];
  const patientBirthdate = patientForm.elements["patient-birthdate"];
  const phonePattern = /^\+?[0-9\s\-()]{10,20}$/;

  clearPatientFormErrors();

  if (!patientName.value.trim()) {
    errors.push({
      field: patientName,
      message: "Введите ФИО пациента."
    });
  }

  if (!patientPhone.value.trim()) {
    errors.push({
      field: patientPhone,
      message: "Введите телефон для связи."
    });
  } else if (!phonePattern.test(patientPhone.value.trim())) {
    errors.push({
      field: patientPhone,
      message: "Введите телефон в понятном формате, например +7 900 123-45-67."
    });
  }

  if (!patientBirthdate.value) {
    errors.push({
      field: patientBirthdate,
      message: "Укажите дату рождения пациента."
    });
  }

  errors.forEach((error) => {
    setFieldError(error.field, error.message);
  });

  return errors;
}

function renderPatientFormErrors(errors) {
  if (!patientFormErrors) {
    return;
  }

  patientFormErrors.innerHTML = "";

  if (errors.length === 0) {
    return;
  }

  const title = document.createElement("p");
  const list = document.createElement("ul");

  title.textContent = "Проверьте поля формы:";

  errors.forEach((error) => {
    const item = document.createElement("li");
    const link = document.createElement("a");

    link.href = `#${error.field.id}`;
    link.textContent = error.message;
    item.append(link);
    list.append(item);
  });

  patientFormErrors.append(title, list);
}

function getSavedAppointment() {
  const savedAppointment = sessionStorage.getItem(appointmentStorageKey);

  if (!savedAppointment) {
    return null;
  }

  try {
    return JSON.parse(savedAppointment);
  } catch {
    sessionStorage.removeItem(appointmentStorageKey);
    return null;
  }
}

function confirmAppointment() {
  if (!patientForm || !appointmentResult) {
    return;
  }

  const appointment = getSavedAppointment();

  if (!appointment) {
    appointmentResult.textContent = "Сначала выберите врача и время приема.";
    setLiveMessage("Сначала выберите врача и время приема.");
    return;
  }

  const patientName = patientForm.elements["patient-name"].value.trim();
  const patientPhone = patientForm.elements["patient-phone"].value.trim();
  const patientBirthdate = patientForm.elements["patient-birthdate"].value;
  const patientComment = patientForm.elements["patient-comment"].value.trim();

  appointmentResult.innerHTML = "";

  const title = document.createElement("h2");
  const summary = document.createElement("dl");

  title.textContent = "Запись подтверждена";

  [
    ["Пациент", patientName],
    ["Телефон", patientPhone],
    ["Дата рождения", formatDate(patientBirthdate)],
    ["Комментарий", patientComment || "Не указан"],
    ["Врач", appointment.doctorName],
    ["Кабинет", appointment.room],
    ["Дата и время", formatSlot(appointment.slot)]
  ].forEach(([termText, descriptionText]) => {
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = termText;
    description.textContent = descriptionText;
    summary.append(term, description);
  });

  appointmentResult.append(title, summary);
  setLiveMessage(`Запись подтверждена. Врач: ${appointment.doctorName}. Время: ${formatSlot(appointment.slot)}.`);
}

function initPatientForm() {
  if (!patientForm) {
    return;
  }

  patientForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const errors = validatePatientForm();

    renderPatientFormErrors(errors);

    if (errors.length > 0) {
      errors[0].field.focus();
      setLiveMessage(`Форма содержит ошибки: ${errors.length}.`);
      return;
    }

    confirmAppointment();
  });
}

initPatientForm();
