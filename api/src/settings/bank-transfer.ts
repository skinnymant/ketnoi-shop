export interface BankTransferDetails {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export function getBankTransferDetails(
  settings: Record<string, unknown> | null | undefined,
): BankTransferDetails | null {
  const bankCode =
    typeof settings?.bank_code === 'string' ? settings.bank_code.trim() : '';
  const accountNumber =
    typeof settings?.bank_account === 'string'
      ? settings.bank_account.trim()
      : '';
  const accountName =
    typeof settings?.bank_name === 'string' ? settings.bank_name.trim() : '';
  if (
    settings?.bank_transfer_enabled !== 'true' ||
    !/^\d{6}$/.test(bankCode) ||
    !/^[a-zA-Z0-9]{1,34}$/.test(accountNumber) ||
    !accountName ||
    accountNumber === '1234567890' ||
    accountName.toUpperCase() === 'CONG TY KET NOI SHOP'
  )
    return null;
  return { bankCode, accountNumber, accountName };
}
