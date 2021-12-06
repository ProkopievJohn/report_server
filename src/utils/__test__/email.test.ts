import { sendMail } from '../email'
import { sendMailMock } from 'test/jest.global.setup'

describe('utils : email', () => {
	it('should run sendMail', async () => {
		sendMail('to', { subject: 'subject', text: 'text' })

		expect(sendMailMock).toHaveBeenCalled()
	})
})
