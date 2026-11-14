import React from "react";

export default function Footer() {
  return (
    <footer className="qt-foot" data-testid="footer">
      <span className="qt-foot-note">
        Veriler TradingView, CoinGecko ve Binance'ten gelir; borsa verileri borsanın kuralına göre gecikmeli olabilir. Bu site yatırım tavsiyesi vermez.
      </span>
      <span className="qt-foot-by">by lenstedreal <span aria-hidden="true">❤️‍🩹</span></span>
    </footer>
  );
}
