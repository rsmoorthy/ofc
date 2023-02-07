var request = require("request-promise")
var sharp = require("sharp")
const csv = require("fast-csv")
const R = require("ramda")
const MongoClient = require("mongodb")
var client

var params = {
  yatraid: "Nov232022",
  travelDate: "23-11-2022"
}

const getHandle = async (dbName, collName) => {
  if (!client) client = await MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true })

  return client.db(dbName).collection(collName)
}

const closeClient = () => {
  if (client) client.close()
}

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const promiseCSV = (path, options) => {
  return new Promise((resolve, reject) => {
    var headers = null
    var records = []
    csv
      .fromPath(path, options)
      .on("data", record => {
        if (!headers) {
          headers = record
          return
        }
        var item = {}
        for (var i = 0; i < headers.length; i++) item[headers[i]] = record[i]
        records.push(item)
      })
      .on("end", function() {
        resolve(records)
      })
  })
}

const main = async (file) => {
  const cl = await getHandle("cico", "photos")
  var records = await promiseCSV(file)
  var upload = []
  var barcode = 12300001
  var count = 0
  await asyncForEach(records, async record => {
    var photob64
    if (!record.barcodewb) return
    if (0 && record.photo) {
      var ph = await cl.findOne({ url: record.photo })
      if (!ph) {
        let options = { url: "https://cico.isha.in" + record.photo, encoding: null }
        let resp = await request.get(options)
        try {
          let imgbuf = await sharp(resp)
            .resize(64)
            .jpeg()
            .toBuffer()
          photob64 = `data:image/jpeg;base64,${imgbuf.toString("base64")}`
          console.log(count, photob64.length)
          await cl.insertOne({ url: record.photo, photob64: photob64 })
        } catch (error) {
          console.log(`Cannot convert ${record.photo}`)
        }
      } else {
        photob64 = ph.photob64
      }
    }
    upload.push({
      yatraid: params.yatraid,
      cicoId: record._id,
      name: record.name,
      age: record.age ? parseInt(record.age) : 99,
      mobile: record.mobile,
      email: record.email,
      city: record.city,
      center: record.center,
      travelDate: record.shivangaYatraDate ? record.shivangaYatraDate : params.travelDate,
      photo: "https://cico.isha.in" + record.photo,
      seatNumber: record.seatNumber,
      barcode: record.barcodewb
    })
    barcode++
    count++
  })

  var options = {
    uri: "https://ofc.rsmoorthy.net/checkins/insert",
    headers: {
      Authorization: "token 5c7385a78c284f5fd2b2345e"
    },
    body: { rows: upload },
    json: true
  }
  console.log("total length uploaded", upload.length, JSON.stringify(options).length);
  var resp;
  for(var i=0; i < upload.length; i += 2000) {
    options.body.rows = upload.slice(i, i+2000);
    console.log("length uploaded", options.body.rows.length, JSON.stringify(options).length);
    resp = await request.put(options)
    console.log(JSON.stringify(resp))
  }
  // request.get(options).then(res => { const buffer = Buffer.from(res, 'utf8'); sharp(buffer).size(1000)
  // .toBuffer().then((buf) => fs.writeFileSync('/tmp/rr.jpg', buf)) })
}

main("/tmp/export_data.csv").then(() => {
  console.log("done uploading")
  // main("/tmp/export_data2.csv").then(() => {
  //   console.log("done 2")
    closeClient()
  // })
})
