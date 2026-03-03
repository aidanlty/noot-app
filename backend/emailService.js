async function sendStatusEmail({ to, customerName, status, orderId, licensePlate, appointmentDate, appointmentTime }) {
  if (!to) {
    console.log('⚠️ No email address provided');
    return;
  }

  const subject = `Update on your service (Order ${orderId || 'N/A'})`;
  
  const html = `
    <p>Hi ${customerName || 'Customer'},</p>
    <p>The status of your vehicle service has been updated to <strong>${status}</strong>.</p>
    ${licensePlate ? `<p>Vehicle: <strong>${licensePlate}</strong></p>` : ''}
    ${appointmentDate ? `<p>Appointment: <strong>${appointmentDate}</strong> ${appointmentTime || ''}</p>` : ''}
    <p>If you have questions, reply to this email.</p>
    <p>– Precision Auto</p>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'Precision Auto <no-reply@precisionauto.com>',
        to,
        subject,
        html
      })
    });

    if (response.ok) {
      console.log(`✅ Email sent to ${to}`);
    } else {
      console.error('❌ Email failed:', await response.text());
    }
  } catch (error) {
    console.error('❌ Email error:', error.message);
  }
}

module.exports = { sendStatusEmail };  // CommonJS export
