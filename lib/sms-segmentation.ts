const GSM_7_BASIC_CHARS = new Set(Array.from(
  "@\u00A3$\u00A5\u00E8\u00E9\u00F9\u00EC\u00F2\u00C7\n\u00D8\u00F8\r\u00C5\u00E5\u0394_\u03A6\u0393\u039B\u03A9\u03A0\u03A8\u03A3\u0398\u039E\u001B\u00C6\u00E6\u00DF\u00C9 !\"#\u00A4%&'()*+,-./0123456789:;<=>?\u00A1ABCDEFGHIJKLMNOPQRSTUVWXYZ\u00C4\u00D6\u00D1\u00DC\u00A7\u00BFabcdefghijklmnopqrstuvwxyz\u00E4\u00F6\u00F1\u00FC\u00E0"
));

const GSM_7_EXTENDED_CHARS = new Set(Array.from("^[~]{}\\|\u20AC"));

export type SmsEncoding = "GSM-7" | "UCS-2";

type SmsEncodingAnalysis = {
  charCount: number,
  encoding: SmsEncoding,
  extendedCharCount: number,
  hasGsmExtendedChars: boolean,
  rawCharCount: number,
};

function analyzeSmsEncoding(message: string): SmsEncodingAnalysis {
  if (!message) {
    return {
      charCount: 0,
      encoding: "GSM-7",
      extendedCharCount: 0,
      hasGsmExtendedChars: false,
      rawCharCount: 0,
    };
  }

  let charCount = 0;
  let extendedCharCount = 0;

  for (const char of message) {
    if (GSM_7_BASIC_CHARS.has(char)) {
      charCount += 1;
      continue;
    }

    if (GSM_7_EXTENDED_CHARS.has(char)) {
      charCount += 2;
      extendedCharCount += 1;
      continue;
    }

    return {
      charCount: message.length,
      encoding: "UCS-2",
      extendedCharCount: 0,
      hasGsmExtendedChars: false,
      rawCharCount: message.length,
    };
  }

  return {
    charCount,
    encoding: "GSM-7",
    extendedCharCount,
    hasGsmExtendedChars: extendedCharCount > 0,
    rawCharCount: message.length,
  };
}

export function getSmsSegmentMetrics(message: string) {
  const analysis = analyzeSmsEncoding(message);
  const singleLimit = analysis.encoding === "UCS-2" ? 70 : 160;
  const multiLimit = analysis.encoding === "UCS-2" ? 67 : 153;

  return {
    charCount: analysis.charCount,
    encoding: analysis.encoding,
    extendedCharCount: analysis.extendedCharCount,
    hasGsmExtendedChars: analysis.hasGsmExtendedChars,
    multiLimit,
    rawCharCount: analysis.rawCharCount,
    segments: analysis.charCount === 0 ? 0 : (
      analysis.charCount <= singleLimit
        ? 1
        : Math.ceil(analysis.charCount / multiLimit)
    ),
    singleLimit,
  };
}

export function calculateSmsSegments(message: string): number {
  return getSmsSegmentMetrics(message).segments;
}
