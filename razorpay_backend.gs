/** BABA NANAK ACADEMY - Razorpay Apps Script backend add-on
 * Add these functions to the same Apps Script project that contains doPost().
 * Required Script Properties:
 * RAZORPAY_KEY_ID
 * RAZORPAY_KEY_SECRET
 */

function razorpayCreateOrder_(data) {
  const keyId = PropertiesService.getScriptProperties().getProperty('RAZORPAY_KEY_ID');
  const keySecret = PropertiesService.getScriptProperties().getProperty('RAZORPAY_KEY_SECRET');
  if (!keyId || !keySecret) throw new Error('Razorpay keys are not configured.');

  const amount = Math.round(Number(data.amount || 0) * 100);
  if (!amount || amount < 100) throw new Error('Invalid payment amount. Minimum ₹1.');

  const payload = {
    amount: amount,
    currency: 'INR',
    receipt: String(data.studentId || 'BNA') + '_' + Date.now(),
    notes: {
      studentId: String(data.studentId || ''),
      courseId: String(data.courseId || ''),
      course: String(data.course || '')
    }
  };

  const auth = Utilities.base64Encode(keyId + ':' + keySecret);
  const res = UrlFetchApp.fetch('https://api.razorpay.com/v1/orders', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Basic ' + auth },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  const out = JSON.parse(res.getContentText() || '{}');
  if (code < 200 || code >= 300 || !out.id) {
    throw new Error(out.error && out.error.description || 'Razorpay order creation failed.');
  }
  return { id: out.id, amount: out.amount, currency: out.currency, keyId: keyId };
}

function verifyRazorpayPayment_(data) {
  const keySecret = PropertiesService.getScriptProperties().getProperty('RAZORPAY_KEY_SECRET');
  if (!keySecret) throw new Error('Razorpay secret is not configured.');
  const orderId = String(data.orderId || '');
  const paymentId = String(data.paymentId || '');
  const signature = String(data.signature || '');
  if (!orderId || !paymentId || !signature) throw new Error('Missing Razorpay payment verification data.');

  const expected = bytesToHex_(Utilities.computeHmacSha256Signature(orderId + '|' + paymentId, keySecret));
  if (expected !== signature) throw new Error('Invalid Razorpay payment signature.');
  return true;
}

function bytesToHex_(bytes) {
  return bytes.map(function(b) {
    const v = b < 0 ? b + 256 : b;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}
