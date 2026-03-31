async function sendStatusEmail({
  to,
  customerName,
  status,
  orderId,
  licensePlate,
  appointmentDate,
  appointmentTime
}) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 sendStatusEmail() CALLED');
  console.log('📧 EMAIL WOULD BE SENT WITH:');
  console.log('To:', to || '(no recipient)');
  console.log('Customer Name:', customerName || 'Customer');
  console.log('Status:', status || '(no status)');
  console.log('Order ID:', orderId || 'N/A');
  console.log('License Plate:', licensePlate || 'N/A');
  console.log('Appointment Date:', appointmentDate || 'N/A');
  console.log('Appointment Time:', appointmentTime || 'N/A');

  const subject = `Update on your service (Order ${orderId || 'N/A'})`;

  const html = `
    <p>Hi ${customerName || 'Customer'},</p>
    <p>The status of your vehicle service has been updated to <strong>${status}</strong>.</p>
    ${licensePlate ? `<p>Vehicle: <strong>${licensePlate}</strong></p>` : ''}
    ${appointmentDate ? `<p>Appointment: <strong>${appointmentDate}</strong> ${appointmentTime || ''}</p>` : ''}
    <p>If you have questions, reply to this email.</p>
    <p>– Porschify</p>
  `;

  console.log('Subject:', subject);
  console.log('HTML Content:', html);
  console.log('✅ TEST MODE: No real email was sent');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    success: true,
    mocked: true
  };
}

module.exports = { sendStatusEmail };

// async function sendStatusEmail({ to, customerName, status, orderId, licensePlate, appointmentDate, appointmentTime }) {
//   if (!to) {
//     console.log('⚠️ No email address provided');
//     return;
//   }

//   const subject = `Update on your service (Order ${orderId || 'N/A'})`;
  
//   const html = `
//     <p>Hi ${customerName || 'Customer'},</p>
//     <p>The status of your vehicle service has been updated to <strong>${status}</strong>.</p>
//     ${licensePlate ? `<p>Vehicle: <strong>${licensePlate}</strong></p>` : ''}
//     ${appointmentDate ? `<p>Appointment: <strong>${appointmentDate}</strong> ${appointmentTime || ''}</p>` : ''}
//     <p>If you have questions, reply to this email.</p>
//     <p>– Porschify</p>
//   `;

//   try {
//     const response = await fetch('https://api.resend.com/emails', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         from: process.env.FROM_EMAIL || 'Porschify <no-reply@porschify.com>',
//         to,
//         subject,
//         html
//       })
//     });

//     if (response.ok) {
//       console.log(`✅ Email sent to ${to}`);
//     } else {
//       console.error('❌ Email failed:', await response.text());
//     }
//   } catch (error) {
//     console.error('❌ Email error:', error.message);
//   }
// }

// module.exports = { sendStatusEmail };  // CommonJS export
