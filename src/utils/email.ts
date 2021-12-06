import nodemailer from 'nodemailer'
import config from '../../config'
import { CaughtError } from './helpers'

const transporter = nodemailer.createTransport(config.mail.transport)

export async function sendMail(to: string, data: { subject: string, text: string }): Promise<void | CaughtError> {
	try {
		if (config.debug) {
			// eslint-disable-next-line no-console
			console.info('[INFO] Email data:', data)
		} else {
			await transporter.sendMail({
				...config.mail.defaultOptions,
				...data,
				to,
			})
		}
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error(
			'[ERROR] Cannot Send Email ',
			'data: ',
			data,
			err,
		)

		throw new CaughtError('[ERROR] Cannot Send Email')
	}
}
