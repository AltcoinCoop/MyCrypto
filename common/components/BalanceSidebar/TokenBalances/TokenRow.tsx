import removeIcon from 'assets/images/icon-remove.svg';
import BN from 'bn.js';
import React from 'react';
import './TokenRow.scss';

interface Props {
  balance: BN;
  symbol: string;
  custom?: boolean;
  onRemove(symbol: string): void;
}
interface State {
  showLongBalance: boolean;
}

export default class TokenRow extends React.Component<Props, State> {
  public state = {
    showLongBalance: false
  };
  public render() {
    const { balance, symbol, custom } = this.props;
    const { showLongBalance } = this.state;
    return (
      <tr className="TokenRow">
        <td
          className="TokenRow-balance"
          title={`${balance.toString()} (Double-Click)`}
          onDoubleClick={this.toggleShowLongBalance}
        >
          {!!custom && (
            <img
              src={removeIcon}
              className="TokenRow-balance-remove"
              title="Remove Token"
              onClick={this.onRemove}
              tabIndex={0}
            />
          )}
          <span>
            {showLongBalance ? balance.toString() : balance.toString()}{' '}
          </span>// TODO: format number
        </td>
        <td className="TokenRow-symbol">{symbol}</td>
      </tr>
    );
  }

  public toggleShowLongBalance = (
    // TODO: don't use any
    e: any
  ) => {
    e.preventDefault();
    this.setState(state => {
      return {
        showLongBalance: !state.showLongBalance
      };
    });
  };

  public onRemove = () => {
    this.props.onRemove(this.props.symbol);
  };
}
