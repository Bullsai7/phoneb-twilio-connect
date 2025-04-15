
import { useState } from 'react';

export const usePhoneNumber = () => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const formatPhoneNumber = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    let formattedValue = '';
    if (numericValue.length <= 3) {
      formattedValue = numericValue;
    } else if (numericValue.length <= 6) {
      formattedValue = `(${numericValue.slice(0, 3)}) ${numericValue.slice(3)}`;
    } else {
      formattedValue = `(${numericValue.slice(0, 3)}) ${numericValue.slice(3, 6)}-${numericValue.slice(6, 10)}`;
    }
    return formattedValue;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const handleDigitClick = (digit: string) => {
    const newPhoneNumber = formatPhoneNumber(phoneNumber + digit);
    setPhoneNumber(newPhoneNumber);
  };

  return {
    phoneNumber,
    setPhoneNumber,
    handlePhoneNumberChange,
    handleDigitClick,
    formatPhoneNumber
  };
};
