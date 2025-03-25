import { convertUsdToEth, MIN_USD_AMOUNT } from '../lib/usdToEth';
import { useEffect, useState } from 'react';

export function useEthPrice(usdAmount?: number) {
  const [minEthPrice, setMinEthPrice] = useState<number>(0);
  useEffect(() => {
    (async () => {
      const minEthPrice = await convertUsdToEth(usdAmount || MIN_USD_AMOUNT);
      if (minEthPrice) {
        setMinEthPrice(+minEthPrice);
      } else {
        setMinEthPrice(0);
      }
    })();
  }, []);
  return { minEthPrice };
}
