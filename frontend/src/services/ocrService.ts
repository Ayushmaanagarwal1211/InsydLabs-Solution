import Tesseract from "tesseract.js";

export interface ChequeData {
  chequeNumber?: string;
  bankName?: string;
  amount?: string;
  date?: string;
  issuedBy?: string;
}

export interface OCRResult {
  success: boolean;
  data?: ChequeData;
  error?: string;
  rawText?: string;
}

const processImage = async (imageFile: File): Promise<OCRResult> => {
  try {
    const result = await Tesseract.recognize(imageFile, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const extractedText = result.data.text;
    const chequeData = parseChequeData(extractedText);

    return {
      success: true,
      data: chequeData,
      rawText: extractedText,
    };
  } catch (error) {
    console.error("OCR processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown OCR error",
    };
  }
};

const parseChequeData = (text: string): ChequeData => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  const data: ChequeData = {};

  const indianBanks = [
    "STATE BANK OF INDIA",
    "SBI",
    "HDFC BANK",
    "HDFC",
    "ICICI BANK",
    "ICICI",
    "AXIS BANK",
    "AXIS",
    "PUNJAB NATIONAL BANK",
    "PNB",
    "CANARA BANK",
    "CANARA",
    "BANK OF BARODA",
    "BOB",
    "UNION BANK",
    "KOTAK MAHINDRA",
    "INDUSIND BANK",
    "YES BANK",
    "IDFC FIRST BANK",
    "FEDERAL BANK",
  ];

  for (const line of lines) {
    const upperLine = line.toUpperCase();

    if (!data.chequeNumber) {
      const chequeNumberMatch = line.match(/\b(\d{6,8})\b/);
      if (chequeNumberMatch) {
        data.chequeNumber = chequeNumberMatch[1];
      }
    }

    if (!data.bankName) {
      for (const bank of indianBanks) {
        if (upperLine.includes(bank)) {
          data.bankName = bank;
          break;
        }
      }
    }

    if (!data.amount) {
      const amountPatterns = [
        /₹\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
        /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
        /INR\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
        /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:only|rupees)/i,
      ];

      for (const pattern of amountPatterns) {
        const match = line.match(pattern);
        if (match) {
          // Remove commas and convert to number format
          const amount = match[1].replace(/,/g, "");
          if (parseFloat(amount) > 0) {
            data.amount = amount;
            break;
          }
        }
      }
    }

    if (!data.date) {
      const datePatterns = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, // DD/MM/YYYY or DD-MM-YYYY
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})/i,
        /(\d{2,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD or YYYY-MM-DD
      ];

      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            let day, month, year;

            if (pattern.source.includes("Jan|Feb")) {
              day = match[1];
              const months = [
                "jan",
                "feb",
                "mar",
                "apr",
                "may",
                "jun",
                "jul",
                "aug",
                "sep",
                "oct",
                "nov",
                "dec",
              ];
              month = (months.indexOf(match[2].toLowerCase()) + 1)
                .toString()
                .padStart(2, "0");
              year = match[3].length === 2 ? `20${match[3]}` : match[3];
            } else if (parseInt(match[1]) > 12) {
              year = match[1];
              month = match[2].padStart(2, "0");
              day = match[3].padStart(2, "0");
            } else {
              day = match[1].padStart(2, "0");
              month = match[2].padStart(2, "0");
              year = match[3].length === 2 ? `20${match[3]}` : match[3];
            }

            const parsedDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
            if (
              parsedDate.getFullYear() == parseInt(year) &&
              parsedDate.getMonth() == parseInt(month) - 1 &&
              parsedDate.getDate() == parseInt(day)
            ) {
              data.date = `${year}-${month}-${day}`;
              break;
            }
          } catch (e) {
            console.error("some error occurred");
          }
        }
      }
    }

    if (!data.issuedBy) {
      if (upperLine.includes("PAY") || upperLine.includes("ACCOUNT")) {
        const nameMatch = line.match(
          /(?:PAY\s+TO|ACCOUNT\s+OF|A\/C)\s+(.+?)(?:\s|$)/i
        );
        if (nameMatch && nameMatch[1].length > 2) {
          data.issuedBy = nameMatch[1].trim();
        }
      }

      if (!data.issuedBy) {
        const namePattern = /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/;
        const nameMatch = line.match(namePattern);
        if (
          nameMatch &&
          !indianBanks.some((bank) => upperLine.includes(bank))
        ) {
          data.issuedBy = nameMatch[1];
        }
      }
    }
  }

  if (data.bankName) {
    const bankMappings: Record<string, string> = {
      SBI: "STATE BANK OF INDIA",
      HDFC: "HDFC BANK",
      ICICI: "ICICI BANK",
      AXIS: "AXIS BANK",
      PNB: "PUNJAB NATIONAL BANK",
      BOB: "BANK OF BARODA",
    };
    data.bankName = bankMappings[data.bankName] || data.bankName;
  }

  if (data.issuedBy) {
    data.issuedBy = data.issuedBy
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (data.bankName) {
    const bankMappings: Record<string, string> = {
      SBI: "STATE BANK OF INDIA",
      HDFC: "HDFC BANK",
      ICICI: "ICICI BANK",
      AXIS: "AXIS BANK",
      PNB: "PUNJAB NATIONAL BANK",
      BOB: "BANK OF BARODA",
    };
    data.bankName = bankMappings[data.bankName] || data.bankName;
  }

  if (data.issuedBy) {
    data.issuedBy = data.issuedBy
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return data;
};

const validateChequeData = (
  data: ChequeData
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.chequeNumber && !/^\d{6,8}$/.test(data.chequeNumber)) {
    errors.push("Invalid cheque number format");
  }

  if (data.amount && isNaN(parseFloat(data.amount))) {
    errors.push("Invalid amount format");
  }

  if (data.date) {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      errors.push("Invalid date format");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const getDataQuality = (
  data: ChequeData
): { score: number; completeness: number } => {
  const fields = ["chequeNumber", "bankName", "amount", "date", "issuedBy"];
  const extractedFields = fields.filter(
    (field) => data[field as keyof ChequeData]
  );

  const completeness = (extractedFields.length / fields.length) * 100;

  let score = 0;
  if (data.chequeNumber) score += 25;
  if (data.amount) score += 30;
  if (data.bankName) score += 20;
  if (data.date) score += 15;
  if (data.issuedBy) score += 10;

  return { score, completeness };
};

export const ocrService = {
  processImage,
  validateChequeData,
  getDataQuality,
};
