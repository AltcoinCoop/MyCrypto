import { AppState } from 'reducers';
import { IOwnedDomainRequest, IBaseDomainRequest } from 'libs/ens';
import { REQUEST_STATES } from 'reducers/ens/domainRequests';
import { isCreationAddress } from 'libs/validators';
import { GenerationStage } from 'reducers/ens/placeBid';
import moment from 'moment';
import { Wei } from 'libs/units';

export const getEns = (state: AppState) => state.ens;

export const getCurrentDomainName = (state: AppState) => getEns(state).domainSelector.currentDomain;

export const getDomainRequests = (state: AppState) => getEns(state).domainRequests;

export const getCurrentDomainData = (state: AppState) => {
  const currentDomain = getCurrentDomainName(state);
  const domainRequests = getDomainRequests(state);

  if (!currentDomain || !domainRequests[currentDomain] || domainRequests[currentDomain].error) {
    return null;
  }

  const domainData = domainRequests[currentDomain].data || null;

  return domainData;
};

export const getResolvedAddress = (state: AppState, noGenesisAddress: boolean = false) => {
  const data = getCurrentDomainData(state);
  if (!data) {
    return null;
  }

  if (isOwned(data)) {
    const { resolvedAddress } = data;
    if (noGenesisAddress) {
      return !isCreationAddress(resolvedAddress) ? resolvedAddress : null;
    }
    return data.resolvedAddress;
  }
  return null;
};

export const getResolvingDomain = (state: AppState) => {
  const currentDomain = getCurrentDomainName(state);
  const domainRequests = getDomainRequests(state);

  if (!currentDomain || !domainRequests[currentDomain]) {
    return null;
  }

  return domainRequests[currentDomain].state === REQUEST_STATES.pending;
};

const isOwned = (data: IBaseDomainRequest): data is IOwnedDomainRequest => {
  return !!(data as IOwnedDomainRequest).ownerAddress;
};

type EnsFields = AppState['ens']['fields'];

export type FieldValues = { [field in keyof EnsFields]: EnsFields[field]['value'] };

export const getFieldValues = (state: AppState) =>
  Object.entries(getFields(state)).reduce<FieldValues>(
    (acc, [field, fieldValue]: [string, EnsFields[keyof EnsFields]]) => ({
      ...acc,
      [field]: fieldValue.value
    }),
    {} as FieldValues
  );

export const getBidPlaceStage = (state: AppState): GenerationStage =>
  getEns(state).placeBid.bidGenerationStage;

export const getAllFieldsValid = (state: AppState): boolean =>
  Object.values(getFields(state)).reduce<boolean>(
    (isValid: boolean, currField: EnsFields[keyof EnsFields]) => isValid && !!currField.value,
    true
  );

export interface ModalFields {
  name: string;
  revealDate: string;
  endDate: string;
  bidMask: Wei;
  bidValue: Wei;
  secretPhrase: string;
}
export const getBidModalFields = (state: AppState): ModalFields => {
  const data = getCurrentDomainData(state);
  if (!data) {
    throw Error();
  }
  const { name, registrationDate } = data;
  const revealDate = moment(registrationDate)
    .add(3, 'days')
    .format('dddd, MMMM Do YYYY, h:mm:ss a');
  const endDate = moment(registrationDate)
    .add(5, 'days')
    .format('dddd, MMMM Do YYYY, h:mm:ss a');
  const { bidMask, bidValue, secretPhrase } = getFieldValues(state);
  if (!(bidMask && bidValue && secretPhrase)) {
    throw Error();
  }
  return { name, revealDate, endDate, bidMask, bidValue, secretPhrase };
};

export const getFields = (state: AppState) => getEns(state).fields;
export const getBidValue = (state: AppState) => getFields(state).bidValue;
export const getBidMask = (state: AppState) => getFields(state).bidMask;
export const getSecret = (state: AppState) => getFields(state).secretPhrase;
