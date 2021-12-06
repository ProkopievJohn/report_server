export const sendMailMock = jest.fn()

jest.mock('nodemailer', () => ({
	createTransport: jest.fn().mockReturnValue({
    sendMail: () => sendMailMock(),
  })
}))
