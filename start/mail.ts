import Mail from '@ioc:Adonis/Addons/Mail'

Mail.monitorQueue((error) => {
  if (error) {
    console.log(`Unable to send email: ${error.message}`)
    return
  }
})
