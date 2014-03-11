
var shows = exports

shows.package = function (doc, req) {
  require("monkeypatch").patch(Object, Date, Array, String)

  var semver = require("semver")
    , code = 200
    , headers = {"Content-Type":"application/json"}
    , body = null

  delete doc.ctime
  delete doc.mtime
  if (!doc._attachments) doc._attachments = {}

  if (doc.time && doc.time.unpublished) {
    delete doc._revisions
    return {
      code : 404,
      body : JSON.stringify(doc),
      headers : headers
    }
  }

  if (doc.versions) Object.keys(doc.versions).forEach(function (v) {
    delete doc.versions[v].ctime
    delete doc.versions[v].mtime
  })

  // legacy kludge
  // XXX which breaks my implementation after following the instructions. so
  // I deleted it and everything works great.
  if (doc["dist-tags"]) for (var tag in doc["dist-tags"]) {
    var clean = semver.clean(doc["dist-tags"][tag], true)
    if (!clean) delete doc["dist-tags"][tag]
    else doc["dist-tags"][tag] = clean
  }
  // end kludge


  if (req.query.version) {
    // could be either one!
    // if it's a fuzzy version or a range, use the max satisfying version
    var ver = req.query.version
    var clean = semver.maxSatisfying(Object.keys(doc.versions), ver, true)

    if (clean && clean !== ver && (clean in doc.versions))
      ver = clean

    // if not a valid version, then treat as a tag.
    if ((!(ver in doc.versions) && (ver in doc["dist-tags"]))
        || !semver.valid(ver)) {
      ver = doc["dist-tags"][ver]
    }
    body = doc.versions[ver]
    if (!body) {
      code = 404
      body = {"error" : "version not found: "+req.query.version}
    }
  } else {
    body = doc
    delete body._revisions
  }

  body = req.query.jsonp
       ? req.query.jsonp + "(" + JSON.stringify(body) + ")"
       : toJSON(body)

  return {
    code : code,
    body : body,
    headers : headers
  }
}


shows.new_package = function (doc, req) {
  var semver = require("semver")
    , code = 200
    , headers = {"Content-Type":"application/json"}
    , body = null

  if (!doc._attachments) doc._attachments = {}

  if (req.query.version) {
    // could be either one!
    // if it's a fuzzy version or a range, use the max satisfying version
    var ver = req.query.version
    var clean = semver.maxSatisfying(Object.keys(doc.versions), ver, true)

    if (clean && clean !== ver && (clean in doc.versions))
      ver = clean

    // if not a valid version, then treat as a tag.
    if ((!(ver in doc.versions) && (ver in doc["dist-tags"]))
        || !semver.valid(ver)) {
      ver = doc["dist-tags"][ver]
    }
    body = doc.versions[ver]
    if (!body) {
      code = 404
      body = {"error" : "version not found: "+req.query.version}
    }
  } else {
    body = doc
  }

  body = toJSON(body)

  return {
    code : code,
    body : body,
    headers : headers
  }
}
