export type OtcMarketCategory = 'Forex' | 'Commodities' | 'Crypto' | 'Stocks' | 'Indices';

export interface OtcMarket {
  symbol: string;
  displaySymbol: string;
  label: string;
  category: OtcMarketCategory;
}

export const OTC_MARKETS: OtcMarket[] = [
  { symbol: 'AEDCNY_OTC', displaySymbol: 'AED/CNY', label: 'AED/CNY OTC', category: 'Forex' },
  { symbol: 'AUDCAD_OTC', displaySymbol: 'AUD/CAD', label: 'AUD/CAD OTC', category: 'Forex' },
  { symbol: 'AUDCHF_OTC', displaySymbol: 'AUD/CHF', label: 'AUD/CHF OTC', category: 'Forex' },
  { symbol: 'AUDJPY_OTC', displaySymbol: 'AUD/JPY', label: 'AUD/JPY OTC', category: 'Forex' },
  { symbol: 'AUDNZD_OTC', displaySymbol: 'AUD/NZD', label: 'AUD/NZD OTC', category: 'Forex' },
  { symbol: 'AUDUSD_OTC', displaySymbol: 'AUD/USD', label: 'AUD/USD OTC', category: 'Forex' },
  { symbol: 'BHDCNY_OTC', displaySymbol: 'BHD/CNY', label: 'BHD/CNY OTC', category: 'Forex' },
  { symbol: 'BRLUSD_OTC', displaySymbol: 'BRL/USD', label: 'BRL/USD OTC', category: 'Forex' },
  { symbol: 'CADCHF_OTC', displaySymbol: 'CAD/CHF', label: 'CAD/CHF OTC', category: 'Forex' },
  { symbol: 'CADJPY_OTC', displaySymbol: 'CAD/JPY', label: 'CAD/JPY OTC', category: 'Forex' },
  { symbol: 'CHFJPY_OTC', displaySymbol: 'CHF/JPY', label: 'CHF/JPY OTC', category: 'Forex' },
  { symbol: 'EURAUD_OTC', displaySymbol: 'EUR/AUD', label: 'EUR/AUD OTC', category: 'Forex' },
  { symbol: 'EURCAD_OTC', displaySymbol: 'EUR/CAD', label: 'EUR/CAD OTC', category: 'Forex' },
  { symbol: 'EURCHF_OTC', displaySymbol: 'EUR/CHF', label: 'EUR/CHF OTC', category: 'Forex' },
  { symbol: 'EURGBP_OTC', displaySymbol: 'EUR/GBP', label: 'EUR/GBP OTC', category: 'Forex' },
  { symbol: 'EURHUF_OTC', displaySymbol: 'EUR/HUF', label: 'EUR/HUF OTC', category: 'Forex' },
  { symbol: 'EURJPY_OTC', displaySymbol: 'EUR/JPY', label: 'EUR/JPY OTC', category: 'Forex' },
  { symbol: 'EURNZD_OTC', displaySymbol: 'EUR/NZD', label: 'EUR/NZD OTC', category: 'Forex' },
  { symbol: 'EURSGD_OTC', displaySymbol: 'EUR/SGD', label: 'EUR/SGD OTC', category: 'Forex' },
  { symbol: 'EURTRY_OTC', displaySymbol: 'EUR/TRY', label: 'EUR/TRY OTC', category: 'Forex' },
  { symbol: 'EURUSD_OTC', displaySymbol: 'EUR/USD', label: 'EUR/USD OTC', category: 'Forex' },
  { symbol: 'GBPAUD_OTC', displaySymbol: 'GBP/AUD', label: 'GBP/AUD OTC', category: 'Forex' },
  { symbol: 'GBPCAD_OTC', displaySymbol: 'GBP/CAD', label: 'GBP/CAD OTC', category: 'Forex' },
  { symbol: 'GBPCHF_OTC', displaySymbol: 'GBP/CHF', label: 'GBP/CHF OTC', category: 'Forex' },
  { symbol: 'GBPJPY_OTC', displaySymbol: 'GBP/JPY', label: 'GBP/JPY OTC', category: 'Forex' },
  { symbol: 'GBPUSD_OTC', displaySymbol: 'GBP/USD', label: 'GBP/USD OTC', category: 'Forex' },
  { symbol: 'NZDJPY_OTC', displaySymbol: 'NZD/JPY', label: 'NZD/JPY OTC', category: 'Forex' },
  { symbol: 'NZDUSD_OTC', displaySymbol: 'NZD/USD', label: 'NZD/USD OTC', category: 'Forex' },
  { symbol: 'OMRCNY_OTC', displaySymbol: 'OMR/CNY', label: 'OMR/CNY OTC', category: 'Forex' },
  { symbol: 'QARCNY_OTC', displaySymbol: 'QAR/CNY', label: 'QAR/CNY OTC', category: 'Forex' },
  { symbol: 'TNDUSD_OTC', displaySymbol: 'TND/USD', label: 'TND/USD OTC', category: 'Forex' },
  { symbol: 'USDBRL_OTC', displaySymbol: 'USD/BRL', label: 'USD/BRL OTC', category: 'Forex' },
  { symbol: 'USDCAD_OTC', displaySymbol: 'USD/CAD', label: 'USD/CAD OTC', category: 'Forex' },
  { symbol: 'USDCHF_OTC', displaySymbol: 'USD/CHF', label: 'USD/CHF OTC', category: 'Forex' },
  { symbol: 'USDCLP_OTC', displaySymbol: 'USD/CLP', label: 'USD/CLP OTC', category: 'Forex' },
  { symbol: 'USDCNH_OTC', displaySymbol: 'USD/CNH', label: 'USD/CNH OTC', category: 'Forex' },
  { symbol: 'USDCOP_OTC', displaySymbol: 'USD/COP', label: 'USD/COP OTC', category: 'Forex' },
  { symbol: 'USDDZD_OTC', displaySymbol: 'USD/DZD', label: 'USD/DZD OTC', category: 'Forex' },
  { symbol: 'USDEGP_OTC', displaySymbol: 'USD/EGP', label: 'USD/EGP OTC', category: 'Forex' },
  { symbol: 'USDJPY_OTC', displaySymbol: 'USD/JPY', label: 'USD/JPY OTC', category: 'Forex' },
  { symbol: 'USDMXN_OTC', displaySymbol: 'USD/MXN', label: 'USD/MXN OTC', category: 'Forex' },
  { symbol: 'USDPKR_OTC', displaySymbol: 'USD/PKR', label: 'USD/PKR OTC', category: 'Forex' },
  { symbol: 'USDSGD_OTC', displaySymbol: 'USD/SGD', label: 'USD/SGD OTC', category: 'Forex' },
  { symbol: 'ZARUSD_OTC', displaySymbol: 'ZAR/USD', label: 'ZAR/USD OTC', category: 'Forex' },

  { symbol: 'UKBRENT_OTC', displaySymbol: 'UKBRENT', label: 'UK Brent OTC', category: 'Commodities' },
  { symbol: 'USCRUDE_OTC', displaySymbol: 'OIL/USD', label: 'Crude Oil OTC', category: 'Commodities' },
  { symbol: 'XAGUSD_OTC', displaySymbol: 'XAG/USD', label: 'Silver OTC', category: 'Commodities' },
  { symbol: 'XAUUSD_OTC', displaySymbol: 'XAU/USD', label: 'Gold OTC', category: 'Commodities' },

  { symbol: 'ADAUSD_OTC', displaySymbol: 'ADA/USD', label: 'Cardano OTC', category: 'Crypto' },
  { symbol: 'APTUSD_OTC', displaySymbol: 'APT/USD', label: 'Aptos OTC', category: 'Crypto' },
  { symbol: 'ARBUSD_OTC', displaySymbol: 'ARB/USD', label: 'Arbitrum OTC', category: 'Crypto' },
  { symbol: 'ATOUSD_OTC', displaySymbol: 'ATOM/USD', label: 'Cosmos OTC', category: 'Crypto' },
  { symbol: 'AVAUSD_OTC', displaySymbol: 'AVAX/USD', label: 'Avalanche OTC', category: 'Crypto' },
  { symbol: 'AXSUSD_OTC', displaySymbol: 'AXS/USD', label: 'Axie Infinity OTC', category: 'Crypto' },
  { symbol: 'BCHUSD_OTC', displaySymbol: 'BCH/USD', label: 'Bitcoin Cash OTC', category: 'Crypto' },
  { symbol: 'BNBUSD_OTC', displaySymbol: 'BNB/USD', label: 'BNB OTC', category: 'Crypto' },
  { symbol: 'BONUSD_OTC', displaySymbol: 'BONK/USD', label: 'Bonk OTC', category: 'Crypto' },
  { symbol: 'BTCUSD_OTC', displaySymbol: 'BTC/USD', label: 'Bitcoin OTC', category: 'Crypto' },
  { symbol: 'DOGUSD_OTC', displaySymbol: 'DOGE/USD', label: 'Dogecoin OTC', category: 'Crypto' },
  { symbol: 'ETHUSD_OTC', displaySymbol: 'ETH/USD', label: 'Ethereum OTC', category: 'Crypto' },
  { symbol: 'FLOUSD_OTC', displaySymbol: 'FLOW/USD', label: 'Flow OTC', category: 'Crypto' },
  { symbol: 'SOLUSD_OTC', displaySymbol: 'SOL/USD', label: 'Solana OTC', category: 'Crypto' },
  { symbol: 'XRPUSD_OTC', displaySymbol: 'XRP/USD', label: 'Ripple OTC', category: 'Crypto' },

  { symbol: 'AXP_OTC', displaySymbol: 'AXP', label: 'American Express OTC', category: 'Stocks' },
  { symbol: 'BA_OTC', displaySymbol: 'BA', label: 'Boeing OTC', category: 'Stocks' },
  { symbol: 'FB_OTC', displaySymbol: 'META', label: 'Meta OTC', category: 'Stocks' },
  { symbol: 'INTC_OTC', displaySymbol: 'INTC', label: 'Intel OTC', category: 'Stocks' },
  { symbol: 'JNJ_OTC', displaySymbol: 'JNJ', label: 'Johnson & Johnson OTC', category: 'Stocks' },
  { symbol: 'MCD_OTC', displaySymbol: 'MCD', label: "McDonald's OTC", category: 'Stocks' },
  { symbol: 'MSFT_OTC', displaySymbol: 'MSFT', label: 'Microsoft OTC', category: 'Stocks' },
  { symbol: 'PFE_OTC', displaySymbol: 'PFE', label: 'Pfizer OTC', category: 'Stocks' },

  { symbol: 'AXJAUDI', displaySymbol: 'AUS200', label: 'Australia 200 OTC', category: 'Indices' },
  { symbol: 'CHIA50I', displaySymbol: 'CHINA50', label: 'China A50 OTC', category: 'Indices' },
  { symbol: 'DJIUSDI', displaySymbol: 'US30', label: 'Dow Jones OTC', category: 'Indices' },
  { symbol: 'F40EURI', displaySymbol: 'FRA40', label: 'France 40 OTC', category: 'Indices' },
  { symbol: 'FTSGBPI', displaySymbol: 'UK100', label: 'FTSE 100 OTC', category: 'Indices' },
  { symbol: 'GEREURI', displaySymbol: 'GER40', label: 'DAX 40 OTC', category: 'Indices' },
  { symbol: 'HSIHKDI', displaySymbol: 'HK50', label: 'Hong Kong 50 OTC', category: 'Indices' },
  { symbol: 'IBXEURI', displaySymbol: 'SPA35', label: 'Spain 35 OTC', category: 'Indices' },
  { symbol: 'IT4EURI', displaySymbol: 'ITA40', label: 'Italy 40 OTC', category: 'Indices' },
  { symbol: 'JPXJPYI', displaySymbol: 'JPN225', label: 'Japan 225 OTC', category: 'Indices' },
  { symbol: 'NDXUSDI', displaySymbol: 'NAS100', label: 'Nasdaq 100 OTC', category: 'Indices' },
  { symbol: 'SPXUSDI', displaySymbol: 'SPX500', label: 'S&P 500 OTC', category: 'Indices' },
  { symbol: 'STXEURI', displaySymbol: 'EUSTX50', label: 'Europe 50 OTC', category: 'Indices' },
];

export type OtcMarketFilter = 'All' | OtcMarketCategory;

export const OTC_MARKET_CATEGORIES: OtcMarketCategory[] = ['Crypto', 'Forex', 'Commodities', 'Indices', 'Stocks'];
export const OTC_MARKET_FILTERS: OtcMarketFilter[] = ['All', ...OTC_MARKET_CATEGORIES];
