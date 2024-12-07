async function makeics(schedule, numberof, reminderUnit) {
  const getReminderTime = (eventTime, reminderUnit, numberof) => {
    const [hours, minutes] = eventTime.split(":").map(Number);
    const eventDate = new Date();
    eventDate.setHours(hours);
    eventDate.setMinutes(minutes);

    let reminderDate = new Date(eventDate);
    if (reminderUnit === 'M') {
      reminderDate.setMinutes(reminderDate.getMinutes() - numberof);
    } else if (reminderUnit === 'H') {
      reminderDate.setHours(reminderDate.getHours() - numberof);
    } else if (reminderUnit === 'D') {
      reminderDate.setDate(reminderDate.getDate() - numberof);
    } else if (reminderUnit === 'S') {
      reminderDate.setSeconds(reminderDate.getSeconds() - numberof);
    }
    return reminderDate;
  };

  function convertDate(dateStr) {
    let dateParts = dateStr.split(' ')[1];
    let separator = dateParts.includes('.') ? '.' : '/';
    let [day, month, year] = dateParts.split(separator);

    let formattedDate = year + month + day;
    return formattedDate;
  }
  

  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\n";

  schedule.forEach(event => {
    const reminderTime = getReminderTime(event.from, reminderUnit, numberof);

    const startDate = convertDate(event.day);
    const endDate = convertDate(event.day);

    icsContent += `BEGIN:VEVENT\n`;
    icsContent += `SUMMARY:${event.subject} - ${event.action}\n`;
    icsContent += `LOCATION:${event.room}\n`;
    icsContent += `DESCRIPTION:Lecture by ${event.teacher}\n`;
    icsContent += `DTSTART;TZID=Europe/Prague:${startDate}T${event.from.replace(":", "")}00\n`;
    icsContent += `DTEND;TZID=Europe/Prague:${endDate}T${event.to.replace(":", "")}00\n`;
    icsContent += `BEGIN:VALARM\n`;
    icsContent += `TRIGGER:-PT${numberof}${reminderUnit}\n`;
    icsContent += `DESCRIPTION:Reminder for ${event.subject}\n`;
    icsContent += `ACTION:DISPLAY\n`;
    icsContent += `END:VALARM\n`;
    icsContent += `END:VEVENT\n`;
  });

  icsContent += "END:VCALENDAR";

  return icsContent;
}

module.exports = makeics;
