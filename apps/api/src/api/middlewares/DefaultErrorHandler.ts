import debug from 'debug'
const log = debug('default-error-handler')

export default (err, req, res, next) => {
    log(err.stack)
    res.status(500).send({
        code: 500,
        message: err.message
    })
}