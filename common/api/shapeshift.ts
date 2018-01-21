import { checkHttpStatus, parseJSON } from 'api/utils';

const SHAPESHIFT_BASE_URL = 'https://shapeshift.io';

export const SHAPESHIFT_TOKEN_WHITELIST = [
  'OMG',
  'REP',
  'SNT',
  'SNGLS',
  'ZRX',
  'SWT',
  'ANT',
  'BAT',
  'BNT',
  'CVC',
  'DNT',
  '1ST',
  'GNO',
  'GNT',
  'EDG',
  'FUN',
  'RLC',
  'TRST',
  'GUP'
];
export const SHAPESHIFT_WHITELIST = [...SHAPESHIFT_TOKEN_WHITELIST, 'ETH', 'ETC', 'BTC'];

interface IPairData {
  limit: number;
  maxLimit: number;
  min: number;
  minerFee: number;
  pair: string;
  rate: string;
}

interface IExtraPairData {
  status: string;
  image: string;
  name: string;
}

interface IAvailablePairData {
  [pairName: string]: IExtraPairData;
}

class ShapeshiftService {
  public whitelist = SHAPESHIFT_WHITELIST;
  private url = SHAPESHIFT_BASE_URL;
  private apiKey = '0ca1ccd50b708a3f8c02327f0caeeece06d3ddc1b0ac749a987b453ee0f4a29bdb5da2e53bc35e57fb4bb7ae1f43c93bb098c3c4716375fc1001c55d8c94c160';
  private postHeaders = {
    'Content-Type': 'application/json'
  };

  public checkStatus(address: string) {
    return fetch(`${this.url}/txStat/${address}`)
      .then(checkHttpStatus)
      .then(parseJSON);
  }

  public sendAmount(
    withdrawal: string,
    originKind: string,
    destinationKind: string,
    destinationAmount: string
  ) {
    const pair = `${originKind.toLowerCase()}_${destinationKind.toLowerCase()}`;

    return fetch(`${this.url}/sendamount`, {
      method: 'POST',
      body: JSON.stringify({
        amount: destinationAmount,
        pair,
        apiKey: this.apiKey,
        withdrawal
      }),
      headers: new Headers(this.postHeaders)
    })
      .then(checkHttpStatus)
      .then(parseJSON)
      .catch(err => {
        // CORS rejection, meaning metamask don't want us
        if (err.name === 'TypeError') {
          throw new Error(
            'Shapeshift has blocked this request, visit shapeshift.io for more information or contact support'
          );
        }
      });
  }

  public getCoins() {
    return fetch(`${this.url}/getcoins`)
      .then(checkHttpStatus)
      .then(parseJSON);
  }

  public getAllRates = async () => {
    const marketInfo = await this.getMarketInfo();
    const pairRates = await this.getPairRates(marketInfo);
    const checkAvl = await this.checkAvl(pairRates);
    const mappedRates = this.mapMarketInfo(checkAvl);
    return mappedRates;
  };

  private getPairRates(marketInfo: IPairData[]) {
    const filteredMarketInfo = marketInfo.filter(obj => {
      const { pair } = obj;
      const pairArr = pair.split('_');
      return this.whitelist.includes(pairArr[0]) && this.whitelist.includes(pairArr[1])
        ? true
        : false;
    });
    const pairRates = filteredMarketInfo.map(p => {
      const { pair } = p;
      const singlePair = Promise.resolve(this.getSinglePairRate(pair));
      return { ...p, ...singlePair };
    });
    return pairRates;
  }

  private async checkAvl(pairRates: IPairData[]) {
    const avlCoins = await this.getAvlCoins();
    const mapAvl = pairRates.map(p => {
      const { pair } = p;
      const pairArr = pair.split('_');

      if (pairArr[0] in avlCoins && pairArr[1] in avlCoins) {
        return {
          ...p,
          ...{
            [pairArr[0]]: {
              name: avlCoins[pairArr[0]].name,
              status: avlCoins[pairArr[0]].status,
              image: avlCoins[pairArr[0]].image
            },
            [pairArr[1]]: {
              name: avlCoins[pairArr[1]].name,
              status: avlCoins[pairArr[1]].status,
              image: avlCoins[pairArr[1]].image
            }
          }
        };
      }
    });
    const filered = mapAvl.filter(v => v);
    return filered as (IPairData & IAvailablePairData)[];
  }

  private getAvlCoins() {
    return fetch(`${this.url}/getcoins`)
      .then(checkHttpStatus)
      .then(parseJSON);
  }

  private getSinglePairRate(pair: string) {
    return fetch(`${this.url}/rate/${pair}`)
      .then(checkHttpStatus)
      .then(parseJSON);
  }

  private getMarketInfo() {
    return fetch(`${this.url}/marketinfo`)
      .then(checkHttpStatus)
      .then(parseJSON);
  }

  private isWhitelisted(coin: string) {
    return this.whitelist.includes(coin);
  }

  private mapMarketInfo(marketInfo: (IPairData & IAvailablePairData)[]) {
    const tokenMap: TokenMap = {};
    marketInfo.forEach(pair => {
      const originKind = pair.pair.substring(0, 3);
      const destinationKind = pair.pair.substring(4, 7);
      if (this.isWhitelisted(originKind) && this.isWhitelisted(destinationKind)) {
        const pairName = originKind + destinationKind;
        const { rate, limit, min } = pair;
        tokenMap[pairName] = {
          id: pairName,
          options: [
            {
              id: originKind,
              status: pair[originKind].status,
              image: pair[originKind].image,
              name: pair[originKind].name
            },
            {
              id: destinationKind,
              status: pair[destinationKind].status,
              image: pair[destinationKind].image,
              name: pair[destinationKind].name
            }
          ],
          rate,
          limit,
          min
        };
      }
    });
    return tokenMap;
  }
}

interface TokenMap {
  [pairName: string]: {
    id: string;
    rate: string;
    limit: number;
    min: number;
    options: (IExtraPairData & { id: string })[];
  };
}
const shapeshift = new ShapeshiftService();

export default shapeshift;
