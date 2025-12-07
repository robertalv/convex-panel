/**
 * Utility functions for generating Gravatar URLs from email addresses
 */

/**
 * MD5 hash implementation for Gravatar (RFC 1321 compliant)
 */
function md5Hash(text: string): string {
  function md5(s: string): string {
    function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
      a = (((a + q) >>> 0) + ((x + t) >>> 0)) >>> 0;
      return ((((a << s) | (a >>> (32 - s))) >>> 0) + b) >>> 0;
    }
    
    function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn((b & c) | ((~b >>> 0) & d), a, b, x, s, t);
    }
    
    function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn((b & d) | (c & ((~d >>> 0))), a, b, x, s, t);
    }
    
    function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn(b ^ c ^ d, a, b, x, s, t);
    }
    
    function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn(c ^ (b | ((~d >>> 0))), a, b, x, s, t);
    }
    
    function binl2hex(binarray: number[]): string {
      const hexTab = "0123456789abcdef";
      let str = "";
      for (let i = 0; i < binarray.length * 4; i++) {
        const byte = (binarray[i >> 2] >>> ((i % 4) * 8)) & 0xFF;
        str += hexTab.charAt((byte >>> 4) & 0xF);
        str += hexTab.charAt(byte & 0xF);
      }
      return str;
    }

    // Convert UTF-8 string to bytes, then to words
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(s);
    const bin: number[] = [];
    const mask = (1 << 8) - 1;
    
    for (let i = 0; i < utf8Bytes.length * 8; i += 8) {
      const byteIndex = i >> 3;
      if (byteIndex < utf8Bytes.length) {
        bin[i >> 5] = (bin[i >> 5] || 0) | ((utf8Bytes[byteIndex] & mask) << (i % 32));
      }
    }

    // Append padding
    const originalLength = utf8Bytes.length * 8;
    bin[originalLength >> 5] |= 0x80 << (originalLength % 32);
    bin[(((originalLength + 64) >>> 9) << 4) + 14] = originalLength;

    let h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476];
    
    for (let i = 0; i < bin.length; i += 16) {
      const olda = h[0] >>> 0;
      const oldb = h[1] >>> 0;
      const oldc = h[2] >>> 0;
      const oldd = h[3] >>> 0;
      
      const x: number[] = [];
      for (let j = 0; j < 16; j++) {
        x[j] = (bin[i + j] || 0) >>> 0;
      }
      
      h[0] = md5ff(h[0], h[1], h[2], h[3], x[0], 7, 0xD76AA478);
      h[3] = md5ff(h[3], h[0], h[1], h[2], x[1], 12, 0xE8C7B756);
      h[2] = md5ff(h[2], h[3], h[0], h[1], x[2], 17, 0x242070DB);
      h[1] = md5ff(h[1], h[2], h[3], h[0], x[3], 22, 0xC1BDCEEE);
      h[0] = md5ff(h[0], h[1], h[2], h[3], x[4], 7, 0xF57C0FAF);
      h[3] = md5ff(h[3], h[0], h[1], h[2], x[5], 12, 0x4787C62A);
      h[2] = md5ff(h[2], h[3], h[0], h[1], x[6], 17, 0xA8304613);
      h[1] = md5ff(h[1], h[2], h[3], h[0], x[7], 22, 0xFD469501);
      h[0] = md5ff(h[0], h[1], h[2], h[3], x[8], 7, 0x698098D8);
      h[3] = md5ff(h[3], h[0], h[1], h[2], x[9], 12, 0x8B44F7AF);
      h[2] = md5ff(h[2], h[3], h[0], h[1], x[10], 17, 0xFFFF5BB1);
      h[1] = md5ff(h[1], h[2], h[3], h[0], x[11], 22, 0x895CD7BE);
      h[0] = md5ff(h[0], h[1], h[2], h[3], x[12], 7, 0x6B901122);
      h[3] = md5ff(h[3], h[0], h[1], h[2], x[13], 12, 0xFD987193);
      h[2] = md5ff(h[2], h[3], h[0], h[1], x[14], 17, 0xA679438E);
      h[1] = md5ff(h[1], h[2], h[3], h[0], x[15], 22, 0x49B40821);
      
      h[0] = md5gg(h[0], h[1], h[2], h[3], x[1], 5, 0xF61E2562);
      h[3] = md5gg(h[3], h[0], h[1], h[2], x[6], 9, 0xC040B340);
      h[2] = md5gg(h[2], h[3], h[0], h[1], x[11], 14, 0x265E5A51);
      h[1] = md5gg(h[1], h[2], h[3], h[0], x[0], 20, 0xE9B6C7AA);
      h[0] = md5gg(h[0], h[1], h[2], h[3], x[5], 5, 0xD62F105D);
      h[3] = md5gg(h[3], h[0], h[1], h[2], x[10], 9, 0x02441453);
      h[2] = md5gg(h[2], h[3], h[0], h[1], x[15], 14, 0xD8A1E681);
      h[1] = md5gg(h[1], h[2], h[3], h[0], x[4], 20, 0xE7D3FBC8);
      h[0] = md5gg(h[0], h[1], h[2], h[3], x[9], 5, 0x21E1CDE6);
      h[3] = md5gg(h[3], h[0], h[1], h[2], x[14], 9, 0xC33707D6);
      h[2] = md5gg(h[2], h[3], h[0], h[1], x[3], 14, 0xF4D50D87);
      h[1] = md5gg(h[1], h[2], h[3], h[0], x[8], 20, 0x455A14ED);
      h[0] = md5gg(h[0], h[1], h[2], h[3], x[13], 5, 0xA9E3E905);
      h[3] = md5gg(h[3], h[0], h[1], h[2], x[2], 9, 0xFCEFA3F8);
      h[2] = md5gg(h[2], h[3], h[0], h[1], x[7], 14, 0x676F02D9);
      h[1] = md5gg(h[1], h[2], h[3], h[0], x[12], 20, 0x8D2A4C8A);
      
      h[0] = md5hh(h[0], h[1], h[2], h[3], x[5], 4, 0xFFFA3942);
      h[3] = md5hh(h[3], h[0], h[1], h[2], x[8], 11, 0x8771F681);
      h[2] = md5hh(h[2], h[3], h[0], h[1], x[11], 16, 0x6D9D6122);
      h[1] = md5hh(h[1], h[2], h[3], h[0], x[14], 23, 0xFDE5380C);
      h[0] = md5hh(h[0], h[1], h[2], h[3], x[1], 4, 0xA4BEEA44);
      h[3] = md5hh(h[3], h[0], h[1], h[2], x[4], 11, 0x4BDECFA9);
      h[2] = md5hh(h[2], h[3], h[0], h[1], x[7], 16, 0xF6BB4B60);
      h[1] = md5hh(h[1], h[2], h[3], h[0], x[10], 23, 0xBEBFBC70);
      h[0] = md5hh(h[0], h[1], h[2], h[3], x[13], 4, 0x289B7EC6);
      h[3] = md5hh(h[3], h[0], h[1], h[2], x[0], 11, 0xEAA127FA);
      h[2] = md5hh(h[2], h[3], h[0], h[1], x[3], 16, 0xD4EF3085);
      h[1] = md5hh(h[1], h[2], h[3], h[0], x[6], 23, 0x04881D05);
      h[0] = md5hh(h[0], h[1], h[2], h[3], x[9], 4, 0xD9D4D039);
      h[3] = md5hh(h[3], h[0], h[1], h[2], x[12], 11, 0xE6DB99E5);
      h[2] = md5hh(h[2], h[3], h[0], h[1], x[15], 16, 0x1FA27CF8);
      h[1] = md5hh(h[1], h[2], h[3], h[0], x[2], 23, 0xC4AC5665);
      
      h[0] = md5ii(h[0], h[1], h[2], h[3], x[0], 6, 0xF4292244);
      h[3] = md5ii(h[3], h[0], h[1], h[2], x[7], 10, 0x432AFF97);
      h[2] = md5ii(h[2], h[3], h[0], h[1], x[14], 15, 0xAB9423A7);
      h[1] = md5ii(h[1], h[2], h[3], h[0], x[5], 21, 0xFC93A039);
      h[0] = md5ii(h[0], h[1], h[2], h[3], x[12], 6, 0x655B59C3);
      h[3] = md5ii(h[3], h[0], h[1], h[2], x[3], 10, 0x8F0CCC92);
      h[2] = md5ii(h[2], h[3], h[0], h[1], x[10], 15, 0xFFEFF47D);
      h[1] = md5ii(h[1], h[2], h[3], h[0], x[1], 21, 0x85845DD1);
      h[0] = md5ii(h[0], h[1], h[2], h[3], x[8], 6, 0x6FA87E4F);
      h[3] = md5ii(h[3], h[0], h[1], h[2], x[15], 10, 0xFE2CE6E0);
      h[2] = md5ii(h[2], h[3], h[0], h[1], x[6], 15, 0xA3014314);
      h[1] = md5ii(h[1], h[2], h[3], h[0], x[13], 21, 0x4E0811A1);
      h[0] = md5ii(h[0], h[1], h[2], h[3], x[4], 6, 0xF7537E82);
      h[3] = md5ii(h[3], h[0], h[1], h[2], x[11], 10, 0xBD3AF235);
      h[2] = md5ii(h[2], h[3], h[0], h[1], x[2], 15, 0x2AD7D2BB);
      h[1] = md5ii(h[1], h[2], h[3], h[0], x[9], 21, 0xEB86D391);
      
      h[0] = ((h[0] >>> 0) + (olda >>> 0)) >>> 0;
      h[1] = ((h[1] >>> 0) + (oldb >>> 0)) >>> 0;
      h[2] = ((h[2] >>> 0) + (oldc >>> 0)) >>> 0;
      h[3] = ((h[3] >>> 0) + (oldd >>> 0)) >>> 0;
    }
    
    return binl2hex(h);
  }
  
  return md5(text.toLowerCase().trim());
}


/**
 * Get Gravatar URL from email address
 * @param email - Email address
 * @param size - Avatar size in pixels (default: 40)
 * @param defaultImage - Fallback image type (default: 'identicon')
 * @returns Gravatar URL or null if email is invalid
 */
export function getGravatarUrl(
  email: string | undefined,
  size: number = 40,
  defaultImage: 'identicon' | 'mp' | 'robohash' | 'retro' | 'blank' | 'wavatar' = 'retro'
): string | null {
  if (!email || !email.includes('@')) {
    console.log('[Gravatar] Invalid email:', email);
    return null;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const hash = md5Hash(normalizedEmail);
    // Use s.gravatar.com (same as NPM) and default=retro (same as NPM)
    const url = `https://s.gravatar.com/avatar/${hash}?size=${size}&default=${defaultImage}`;
    
    // Log full email for debugging (can be removed in production)
    console.log('[Gravatar] Generated URL:', {
      email: email, // Full email for debugging
      normalizedEmail: normalizedEmail, // Full normalized email
      hash,
      url,
      size,
      defaultImage,
      note: 'This matches NPM\'s internal Gravatar URLs (NPM JWT avatars just wrap these)',
    });
    
    return url;
  } catch (error) {
    console.error('[Gravatar] Failed to generate Gravatar URL:', error, { email });
    return null;
  }
}

/**
 * Get Gravatar URLs for multiple email addresses
 * @param emails - Array of email addresses
 * @param size - Avatar size in pixels (default: 40)
 * @returns Map of email to Gravatar URL
 */
export function getGravatarUrls(
  emails: (string | undefined)[],
  size: number = 40
): Map<string, string> {
  const urlMap = new Map<string, string>();
  const validEmails = emails.filter((email): email is string => 
    Boolean(email && email.includes('@'))
  );

  validEmails.forEach((email) => {
    const url = getGravatarUrl(email, size);
    if (url) {
      urlMap.set(email, url);
    }
  });

  return urlMap;
}