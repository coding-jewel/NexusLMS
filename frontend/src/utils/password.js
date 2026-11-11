// Matches the backend regex: 8-100 chars, at least 1 letter, 1 number, 1 special char.
export const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,100}$/

export const PASSWORD_HINT = "At least 8 characters, including a letter, number, and special character."