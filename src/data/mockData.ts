import { Stock } from '../types/portfolio';

export const mockStocks: Omit<Stock, 'investment' | 'portfolioPercentage' | 'presentValue' | 'gainLoss'>[] = [
  {
    id: '1',
    particulars: 'Reliance Industries Ltd',
    purchasePrice: 2450.00,
    quantity: 10,
    exchange: 'NSE',
    sector: 'Energy',
    cmp: 2678.50, // Mock current price (higher than purchase)
    peRatio: 12.5,
    latestEarnings: '₹15,138 Cr (Q2 FY24)',
  },
  {
    id: '2',
    particulars: 'Tata Consultancy Services',
    purchasePrice: 3200.00,
    quantity: 5,
    exchange: 'NSE',
    sector: 'Technology',
    cmp: 3156.75, // Mock current price (lower than purchase)
    peRatio: 28.3,
    latestEarnings: '₹11,342 Cr (Q2 FY24)',
  },
  {
    id: '3',
    particulars: 'HDFC Bank Ltd',
    purchasePrice: 1650.00,
    quantity: 15,
    exchange: 'NSE',
    sector: 'Financials',
    cmp: 1723.20, // Mock current price (higher than purchase)
    peRatio: 18.7,
    latestEarnings: '₹16,512 Cr (Q2 FY24)',
  },
  {
    id: '4',
    particulars: 'Infosys Ltd',
    purchasePrice: 1450.00,
    quantity: 12,
    exchange: 'NSE',
    sector: 'Technology',
    cmp: 1389.45, // Mock current price (lower than purchase)
    peRatio: 25.1,
    latestEarnings: '₹6,368 Cr (Q2 FY24)',
  },
  {
    id: '5',
    particulars: 'ICICI Bank Ltd',
    purchasePrice: 980.00,
    quantity: 20,
    exchange: 'NSE',
    sector: 'Financials',
    cmp: 1045.80, // Mock current price (higher than purchase)
    peRatio: 15.6,
    latestEarnings: '₹9,648 Cr (Q2 FY24)',
  },
  {
    id: '6',
    particulars: 'Asian Paints Ltd',
    purchasePrice: 3100.00,
    quantity: 8,
    exchange: 'NSE',
    sector: 'Consumer Goods',
    cmp: 2987.30, // Mock current price (lower than purchase)
    peRatio: 52.4,
    latestEarnings: '₹1,234 Cr (Q2 FY24)',
  },
  {
    id: '7',
    particulars: 'Bharti Airtel Ltd',
    purchasePrice: 850.00,
    quantity: 25,
    exchange: 'NSE',
    sector: 'Telecommunications',
    cmp: 923.15, // Mock current price (higher than purchase)
    peRatio: 67.8,
    latestEarnings: '₹3,593 Cr (Q2 FY24)',
  },
  {
    id: '8',
    particulars: 'Wipro Ltd',
    purchasePrice: 420.00,
    quantity: 30,
    exchange: 'NSE',
    sector: 'Technology',
    cmp: 398.25, // Mock current price (lower than purchase)
    peRatio: 22.9,
    latestEarnings: '₹2,835 Cr (Q2 FY24)',
  },
];

// Mock function to simulate API delay
export const mockApiDelay = (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};