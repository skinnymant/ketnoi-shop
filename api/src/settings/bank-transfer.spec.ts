import { getBankTransferDetails } from './bank-transfer';
import { getBankTransferDetails as getFrontendDetails } from '../../../ketnoi-shop/web/lib/bank-transfer';

// Synthetic recipient used only in local tests; never sent to a banking service.
const valid = {
  bank_transfer_enabled: 'true',
  bank_code: '970436',
  bank_account: 'TESTONLY001',
  bank_name: 'TEST RECIPIENT',
};

describe.each([
  ['API', getBankTransferDetails],
  ['checkout', getFrontendDetails],
])('%s bank transfer configuration', (_name, getDetails) => {
  it('returns an explicitly enabled complete recipient and trims whitespace', () => {
    expect(
      getDetails({
        ...valid,
        bank_code: ' 970436 ',
        bank_account: ' TESTONLY001 ',
        bank_name: ' TEST RECIPIENT ',
      }),
    ).toEqual({
      bankCode: '970436',
      accountNumber: 'TESTONLY001',
      accountName: 'TEST RECIPIENT',
    });
  });

  it.each([
    ['absent configuration', undefined],
    ['null response', null],
    ['empty configuration', {}],
    ['disabled transfer', { ...valid, bank_transfer_enabled: 'false' }],
    ['not explicitly enabled', { ...valid, bank_transfer_enabled: undefined }],
    ['wrong enablement type', { ...valid, bank_transfer_enabled: true }],
    ['demo account number', { ...valid, bank_account: '1234567890' }],
    ['demo account holder', { ...valid, bank_name: ' cong ty ket noi shop ' }],
    ['missing bank', { ...valid, bank_code: '' }],
    ['invalid bank code', { ...valid, bank_code: 'VCB' }],
    ['missing account', { ...valid, bank_account: '' }],
    ['invalid account characters', { ...valid, bank_account: '../account' }],
    ['oversized account', { ...valid, bank_account: '1'.repeat(35) }],
    ['missing holder', { ...valid, bank_name: '   ' }],
    ['non-string bank', { ...valid, bank_code: 970436 }],
    ['non-string account', { ...valid, bank_account: 10001 }],
    ['non-string holder', { ...valid, bank_name: {} }],
  ])('fails closed for %s', (_caseName, settings) => {
    expect(getDetails(settings)).toBeNull();
  });
});
