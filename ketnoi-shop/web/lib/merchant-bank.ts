import type { BankTransferDetails } from './bank-transfer';

// Recipient supplied by the SWE owner. BIN/account also decoded from their QR.
// Public payment details, not credentials. Changes require owner confirmation.
export const SWE_BANK: Readonly<BankTransferDetails> = Object.freeze({
  bankCode: '970422',
  accountNumber: '6605666888',
  accountName: 'CONG TY TNHH THUONG MAI VA DICH SWE',
});

export const SWE_BANK_LABEL = 'MB Bank (Ngân hàng TMCP Quân Đội)';
export const SWE_BANK_BRANCH = 'Chi nhánh Việt Trì, Phú Thọ';
