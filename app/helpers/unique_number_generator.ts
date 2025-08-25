/**
 * Generates a unique index number for students
 * @param firstName - Student's first name
 * @param lastName - Student's last name
 * @returns A unique index number string
 */
export const generateUniqueIndexNumber = (firstName: string, lastName: string): string => {
  const uniqueLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '123456789';
  const allChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';

  // First 4 characters: 2 random capitals + first letters of first/last name (or random if not available)
  const firstTwo = Array(2).fill(null).map(() => uniqueLetters[Math.floor(Math.random() * uniqueLetters.length)]).join('');

  // Get initials from names, or use random letters if names are not available
  const firstNameInitial = firstName && firstName.length > 0 ? firstName[0].toUpperCase() : uniqueLetters[Math.floor(Math.random() * uniqueLetters.length)];
  const lastNameInitial = lastName && lastName.length > 0 ? lastName[0].toUpperCase() : uniqueLetters[Math.floor(Math.random() * uniqueLetters.length)];
  const nameInitials = firstNameInitial + lastNameInitial;

  // Second set: 2 numbers + 1 letter + 1 number
  const secondSet = Array(2).fill(null).map(() => numbers[Math.floor(Math.random() * numbers.length)]).join('') +
    uniqueLetters[Math.floor(Math.random() * uniqueLetters.length)] +
    numbers[Math.floor(Math.random() * numbers.length)];

  // Third set: random mix of 4 numbers/letters
  const thirdSet = Array(4).fill(null).map(() => allChars[Math.floor(Math.random() * allChars.length)]).join('');

  // Fourth set: letter + 2 numbers + letter
  const fourthSet = uniqueLetters[Math.floor(Math.random() * uniqueLetters.length)] +
    Array(2).fill(null).map(() => numbers[Math.floor(Math.random() * numbers.length)]).join('') +
    uniqueLetters[Math.floor(Math.random() * uniqueLetters.length)];

  return firstTwo + nameInitials + secondSet + thirdSet + fourthSet;
};
