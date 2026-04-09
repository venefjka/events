/**
 * Утилиты для валидации форм
 */

/**
 * Валидирует email адрес
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Валидирует пароль (минимум 6 символов)
 */
export const isValidPassword = (password: string): boolean => {
  return password.trim().length >= 6;
};

/**
 * Валидирует возраст (от 18 лет)
 */
export const isValidAge = (age: number | string): boolean => {
  const ageNum = typeof age === 'string' ? parseInt(age, 10) : age;
  return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 120;
};

const parseBirthDate = (birthDate: string): Date | null => {
  const trimmed = birthDate.trim();
  const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const parseCalendarDate = (value: string): Date | null => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const parseTimeString = (value: string): { hours: number; minutes: number } | null => {
  const trimmed = value.trim();
  const match = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return null;
  }
  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
};

const buildDateTime = (dateValue: string, timeValue: string): Date | null => {
  const date = parseCalendarDate(dateValue);
  const time = parseTimeString(timeValue);
  if (!date || !time) return null;
  const result = new Date(date);
  result.setHours(time.hours, time.minutes, 0, 0);
  return result;
};

const startOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getAgeFromDate = (date: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
};

export const getAgeFromBirthDate = (birthDate: string): number | null => {
  if (!birthDate?.trim()) return null;
  const parsed = parseBirthDate(birthDate);
  if (parsed) {
    return getAgeFromDate(parsed);
  }

  const isoDate = new Date(birthDate);
  if (!Number.isNaN(isoDate.getTime())) {
    return getAgeFromDate(isoDate);
  }

  return null;
};

/**
 * Валидирует дату рождения (ДД.ММ.ГГГГ) и возраст
 */
export const isValidBirthDate = (birthDate: string): boolean => {
  const date = parseBirthDate(birthDate);

  if (!date) {
    return false;
  }

  const age = getAgeFromDate(date);
  return age >= 18 && age <= 120;
};

/**
 * Валидирует имя (не пустое, минимум 2 символа)
 */
export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2;
};

/**
 * Валидирует цену (неотрицательное число)
 */
export const isValidPrice = (price: number | string): boolean => {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(priceNum) && priceNum >= 0;
};

/**
 * Валидирует количество участников
 */
export const isValidParticipantsCount = (count: number, min: number = 1, max: number = 100): boolean => {
  return count >= min && count <= max;
};

/**
 * Получает сообщение об ошибке для email
 */
export const getEmailError = (email: string): string | null => {
  if (!email.trim()) {
    return 'Email обязателен';
  }
  if (!isValidEmail(email)) {
    return 'Некорректный email адрес';
  }
  return null;
};

/**
 * Получает сообщение об ошибке для пароля
 */
export const getPasswordError = (password: string): string | null => {
  if (!password.trim()) {
    return 'Пароль обязателен';
  }
  if (!isValidPassword(password)) {
    return 'Пароль должен содержать минимум 6 символов';
  }
  return null;
};

/**
 * Получает сообщение об ошибке для подтверждения пароля
 */
export const getConfirmPasswordError = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword.trim()) {
    return 'Подтвердите пароль';
  }
  if (confirmPassword !== password) {
    return 'Пароли не совпадают';
  }
  return null;
};

/**
 * Получает сообщение об ошибке для даты рождения
 */
export const getBirthDateError = (birthDate: string): string | null => {
  if (!birthDate.trim()) {
    return 'Укажите дату рождения';
  }

  const date = parseBirthDate(birthDate);

  if (!date) {
    return 'Введите дату в формате ДД.ММ.ГГГГ';
  }

  const age = getAgeFromDate(date);

  if (age < 18) {
    return 'Регистрация доступна с 18 лет';
  }
  if (age > 120) {
    return 'Укажите корректную дату рождения';
  }

  return null;
};

/**
 * Получает сообщение об ошибке для возраста
 */
export const getAgeError = (age: number | string): string | null => {
  const ageNum = typeof age === 'string' ? parseInt(age, 10) : age;
  if (isNaN(ageNum)) {
    return 'Возраст должен быть числом';
  }
  if (!isValidAge(ageNum)) {
    return 'Возраст должен быть от 18 до 120 лет';
  }
  return null;
};

/**
 * Получает сообщение об ошибке для имени
 */
export const getNameError = (name: string): string | null => {
  if (!name.trim()) {
    return 'Имя обязательно';
  }
  if (!isValidName(name)) {
    return 'Имя должно содержать минимум 2 символа';
  }
  return null;
};


export const getEventDateError = (dateValue: string, maxYearsAhead = 2): string | null => {
  if (!dateValue.trim()) {
    return 'Введите дату';
  }

  const date = parseCalendarDate(dateValue);
  if (!date) {
    return 'Введите дату в формате ДД.ММ.ГГГГ';
  }

  const today = startOfDay(new Date());
  const eventDay = startOfDay(date);
  if (eventDay < today) {
    return 'Дата не может быть в прошлом';
  }

  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + maxYearsAhead);
  if (eventDay > maxDate) {
    return 'Дата слишком далеко в будущем';
  }

  return null;
};

export const getEndDateError = (
  endDateValue: string,
  startDateValue: string,
  maxYearsAhead = 2
): string | null => {
  if (!endDateValue.trim()) {
    return 'Введите дату';
  }

  const endDate = parseCalendarDate(endDateValue);
  if (!endDate) {
    return 'Введите дату в формате ДД.ММ.ГГГГ';
  }

  const startDate = parseCalendarDate(startDateValue);
  if (startDate && startOfDay(endDate) < startOfDay(startDate)) {
    return 'Дата окончания должна быть позже даты начала';
  }

  const today = startOfDay(new Date());
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + maxYearsAhead);
  if (startOfDay(endDate) > maxDate) {
    return 'Дата слишком далеко в будущем';
  }

  if (startOfDay(endDate) < today) {
    return 'Дата не может быть в прошлом';
  }

  return null;
};

export const getRepeatEndDateError = (
  endDateValue: string,
  startDateValue: string,
  maxYearsAhead = 2
): string | null => {
  if (!endDateValue.trim()) {
    return 'Введите дату последнего проведения';
  }

  const endDate = parseCalendarDate(endDateValue);
  if (!endDate) {
    return 'Введите дату в формате ДД.ММ.ГГГГ';
  }

  const startDate = parseCalendarDate(startDateValue);
  if (startDate && startOfDay(endDate) < startOfDay(startDate)) {
    return 'Дата последнего проведения должна быть позже даты начала';
  }

  const today = startOfDay(new Date());
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + maxYearsAhead);
  if (startOfDay(endDate) > maxDate) {
    return 'Дата слишком далеко в будущем';
  }

  if (startOfDay(endDate) < today) {
    return 'Дата не может быть в прошлом';
  }

  return null;
};

export const getStartTimeError = (timeValue: string): string | null => {
  if (!timeValue.trim()) {
    return 'Введите время начала проведения';
  }
  if (!parseTimeString(timeValue)) {
    return 'Время должно быть в формате ЧЧ:ММ';
  }
  return null;
};

export const getEndTimeError = (timeValue: string): string | null => {
  if (!timeValue.trim()) {
    return 'Введите время окончания проведения';
  }
  if (!parseTimeString(timeValue)) {
    return 'Время должно быть в формате ЧЧ:ММ';
  }
  return null;
};

export const getTimeRangeError = (
  startDateValue: string,
  startTime: string,
  endTime: string,
  endDateValue?: string
): string | null => {
  const effectiveEndDate = endDateValue?.trim() ? endDateValue : startDateValue;
  const start = buildDateTime(startDateValue, startTime);
  const end = buildDateTime(effectiveEndDate, endTime);
  if (!start || !end) return null;
  if (end <= start) {
    return 'Время окончания должно быть позже начала';
  }
  return null;
};

export const getEventDateTimeError = (dateValue: string, startTime: string): string | null => {
  const start = buildDateTime(dateValue, startTime);
  if (!start) return null;
  if (start < new Date()) {
    return 'Событие не может начаться в прошлом';
  }
  return null;
};

export const getScheduleDateTime = (dateValue: string, timeValue: string): Date | null =>
  buildDateTime(dateValue, timeValue);
