import nodemailer from 'nodemailer'

const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER
const smtpSecureEnv = process.env.SMTP_SECURE
const smtpSecure = typeof smtpSecureEnv === 'string'
  ? smtpSecureEnv.toLowerCase() === 'true'
  : smtpPort === 465
const smtpDebug = (process.env.SMTP_DEBUG || '').toLowerCase() === 'true'

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn('SMTP no configurado completamente. Define SMTP_HOST, SMTP_USER y SMTP_PASS en el entorno.')
}

export const mailTransporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure, // true: SSL (465), false: STARTTLS (587)
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  logger: smtpDebug,
  debug: smtpDebug,
})

export async function sendMail(options: {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}) {
  const { to, subject, html, text, from } = options
  const info = await mailTransporter.sendMail({
    from: from || smtpFrom,
    to,
    subject,
    html,
    text,
  })
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SMTP] Sent mail to', to, 'messageId=', info.messageId)
  }
  return info
}

export async function verifySmtp() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP no configurado: faltan SMTP_HOST/SMTP_USER/SMTP_PASS')
  }
  return mailTransporter.verify()
}


