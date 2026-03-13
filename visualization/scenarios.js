/**
 * Backend Factory Visualizer - Animation Scenario Catalog
 *
 * A comprehensive catalog of visual micro-animations mapped to backend operations.
 * Agents pick the appropriate scenario based on code patterns they find.
 * The visualization renders the matching animation, bubble text, and props.
 *
 * Each scenario has:
 * - id: unique identifier agents reference
 * - category: grouping
 * - operation: what backend thing is happening
 * - visual: what the character physically does (factory/office worker metaphor)
 * - bubbles: array of speech bubble texts to randomly pick from
 * - prop: optional item the character "carries" (rendered as a small icon near them)
 * - propColor: color of the prop
 * - stationGlow: color the station glows during this action
 * - patterns: code patterns that trigger this (for agent matching)
 */

(function() {
  'use strict';

  const SCENARIOS = {

    // ═══════════════════════════════════════════
    // AUTHENTICATION
    // ═══════════════════════════════════════════
    'auth-login': {
      category: 'auth', operation: 'User Login',
      visual: 'Picks up golden key, inserts into lock',
      bubbles: ['key to access!', 'logging in...', 'opening door...', 'welcome!'],
      prop: '🔑', propColor: '#ffd54a', stationGlow: '#ffd54a',
      patterns: ['login', 'authenticate', 'signIn', 'sign_in', 'POST /login', 'POST /auth'],
    },
    'auth-verify-token': {
      category: 'auth', operation: 'Token Verification',
      visual: 'Holds scroll up to magnifying glass',
      bubbles: ['is this legit?', 'verifying token...', 'checking JWT...', 'who are you?'],
      prop: '🔍', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['jwt.verify', 'verifyToken', 'validateToken', 'checkToken', 'decode', 'bearer'],
    },
    'auth-api-key': {
      category: 'auth', operation: 'API Key Check',
      visual: 'Compares key against clipboard list',
      bubbles: ['checking key...', 'API key valid?', 'on the list?', 'permission check'],
      prop: '📋', propColor: '#88ffcc', stationGlow: '#88ffcc',
      patterns: ['apiKey', 'api_key', 'X-API-Key', 'keyHash', 'checkApiKey'],
    },
    'auth-oauth': {
      category: 'auth', operation: 'OAuth Flow',
      visual: 'Guides two characters to shake hands at trust gate',
      bubbles: ['delegated trust!', 'OAuth handshake', 'authorized!', 'consent granted'],
      prop: '🤝', propColor: '#b44aff', stationGlow: '#b44aff',
      patterns: ['oauth', 'OAuth2', 'authorize', 'callback', 'grant_type', 'authorization_code'],
    },
    'auth-session-create': {
      category: 'auth', operation: 'Session Created',
      visual: 'Stamps blank ID card, hands it over',
      bubbles: ['new session!', 'welcome aboard', 'here\'s your badge', 'session started'],
      prop: '🪪', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['session.create', 'createSession', 'req.session', 'sessionStore.set'],
    },
    'auth-session-destroy': {
      category: 'auth', operation: 'Session Destroyed',
      visual: 'Crumples ID card into shredder',
      bubbles: ['session over', 'goodbye!', 'logging out...', 'shredding badge'],
      prop: '🗑', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['session.destroy', 'logout', 'signOut', 'sign_out', 'DELETE /session'],
    },
    'auth-password-hash': {
      category: 'auth', operation: 'Password Hashing',
      visual: 'Feeds document into sparking machine, scrambled output',
      bubbles: ['scrambling...', 'hashing password', 'bcrypt go brrr', 'securing secret'],
      prop: '⚡', propColor: '#e07a3a', stationGlow: '#e07a3a',
      patterns: ['bcrypt', 'argon2', 'hash', 'pbkdf2', 'scrypt', 'hashPassword'],
    },
    'auth-mfa': {
      category: 'auth', operation: 'Multi-Factor Auth',
      visual: 'Shows one key, then holds up second lock',
      bubbles: ['need one more!', '2FA required', 'second factor...', 'almost in...'],
      prop: '🔐', propColor: '#ffd54a', stationGlow: '#ffd54a',
      patterns: ['mfa', '2fa', 'totp', 'otp', 'twoFactor', 'authenticator'],
    },
    'auth-refresh-token': {
      category: 'auth', operation: 'Token Refresh',
      visual: 'Swaps faded card for shiny new one',
      bubbles: ['new token!', 'refreshing...', 'swap old for new', 'renewed!'],
      prop: '🔄', propColor: '#4af5ff', stationGlow: '#4af5ff',
      patterns: ['refreshToken', 'refresh_token', 'token.renew', 'POST /refresh'],
    },

    // ═══════════════════════════════════════════
    // DATABASE
    // ═══════════════════════════════════════════
    'db-select': {
      category: 'database', operation: 'Read/SELECT',
      visual: 'Searches through cabinet, pulls out folder',
      bubbles: ['found it!', 'reading data...', 'SELECT *...', 'pulling records'],
      prop: '📁', propColor: '#ffd54a', stationGlow: '#ffd54a',
      patterns: ['SELECT', 'find', 'findOne', 'findMany', 'get', 'fetch', 'query', 'read'],
    },
    'db-insert': {
      category: 'database', operation: 'Write/INSERT',
      visual: 'Files new folder into cabinet carefully',
      bubbles: ['new entry!', 'INSERT INTO...', 'saving data...', 'filing away'],
      prop: '📝', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['INSERT', 'create', 'save', 'insert', 'insertOne', 'insertMany', 'add'],
    },
    'db-update': {
      category: 'database', operation: 'Modify/UPDATE',
      visual: 'Takes folder out, scribbles changes, puts back',
      bubbles: ['making changes...', 'UPDATE SET...', 'editing record', 'patching data'],
      prop: '✏️', propColor: '#e07a3a', stationGlow: '#e07a3a',
      patterns: ['UPDATE', 'update', 'patch', 'modify', 'updateOne', 'set'],
    },
    'db-delete': {
      category: 'database', operation: 'Remove/DELETE',
      visual: 'Grabs folder, crumples it, tosses in bin',
      bubbles: ['gone for good!', 'DELETE FROM...', 'removing...', 'into the bin!'],
      prop: '🗑', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['DELETE', 'delete', 'destroy', 'remove', 'deleteOne', 'drop'],
    },
    'db-transaction': {
      category: 'database', operation: 'Transaction',
      visual: 'Puts on TRANSACTION armband, stamps COMMIT or throws ROLLBACK',
      bubbles: ['all or nothing!', 'BEGIN...', 'committing...', 'atomic operation'],
      prop: '📋', propColor: '#b44aff', stationGlow: '#b44aff',
      patterns: ['transaction', 'beginTransaction', 'commit', 'rollback', 'tx.', '@transactional'],
    },
    'db-migration': {
      category: 'database', operation: 'Migration',
      visual: 'Carries blueprint and toolbox, hammers on cabinet structure',
      bubbles: ['restructuring!', 'migration time', 'schema change!', 'building new shelf'],
      prop: '🔨', propColor: '#e07a3a', stationGlow: '#e07a3a',
      patterns: ['migrate', 'migration', 'ALTER TABLE', 'createTable', 'addColumn'],
    },
    'db-deadlock': {
      category: 'database', operation: 'Deadlock',
      visual: 'Two characters pull opposite ends of same folder, both stuck',
      bubbles: ['stuck!', 'deadlock!', 'can\'t move!', 'who goes first?!'],
      prop: '⛔', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['deadlock', 'lock timeout', 'SQLSTATE 40001'],
    },
    'db-bulk-insert': {
      category: 'database', operation: 'Bulk Insert',
      visual: 'Drives tiny forklift dumping huge stack of folders',
      bubbles: ['massive load!', 'bulk insert!', 'so many records!', 'forklift mode'],
      prop: '📦', propColor: '#ffd54a', stationGlow: '#ffd54a',
      patterns: ['bulkInsert', 'insertMany', 'bulkCreate', 'COPY FROM', 'batchInsert'],
    },
    'db-connection-pool': {
      category: 'database', operation: 'Connection Pool',
      visual: 'Manages line of characters waiting for workstation',
      bubbles: ['next in line!', 'pool busy...', 'acquiring conn...', 'wait your turn'],
      prop: '🎟', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['pool', 'getConnection', 'acquire', 'release', 'connectionPool', 'maxConnections'],
    },

    // ═══════════════════════════════════════════
    // CACHE
    // ═══════════════════════════════════════════
    'cache-hit': {
      category: 'cache', operation: 'Cache Hit',
      visual: 'Pulls box from nearby shelf, smiles triumphantly',
      bubbles: ['got it!', 'cache HIT!', 'right on the shelf!', 'instant!'],
      prop: '✅', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['cache.get', 'redis.get', 'fromCache', 'cached'],
    },
    'cache-miss': {
      category: 'cache', operation: 'Cache Miss',
      visual: 'Shrugs at empty shelf, walks to distant cabinet',
      bubbles: ['not here...', 'cache MISS', 'gotta go to DB', 'empty shelf!'],
      prop: '❌', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['cache.get', 'cacheMiss', 'not_found_in_cache'],
    },
    'cache-invalidate': {
      category: 'cache', operation: 'Cache Invalidate',
      visual: 'Throws box labeled STALE into fire pit, watches it burn',
      bubbles: ['burn the old!', 'invalidating!', 'stale data bye!', 'clearing cache'],
      prop: '🔥', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['cache.del', 'cache.invalidate', 'cache.clear', 'cache.flush', 'evict'],
    },
    'cache-warm': {
      category: 'cache', operation: 'Cache Warm-up',
      visual: 'Arranges fresh boxes onto empty shelf, polishing them',
      bubbles: ['warming up!', 'preloading...', 'filling shelves', 'getting ready'],
      prop: '📦', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['warmup', 'preload', 'populateCache', 'cache.warm', 'initCache'],
    },
    'cache-set-ttl': {
      category: 'cache', operation: 'Set TTL',
      visual: 'Places tiny hourglass on top of cached box',
      bubbles: ['tick-tock!', 'setting timer', 'expires soon', 'TTL set'],
      prop: '⏳', propColor: '#e07a3a', stationGlow: '#e07a3a',
      patterns: ['ttl', 'SETEX', 'EXPIRE', 'expires_in', 'cache.set'],
    },

    // ═══════════════════════════════════════════
    // QUEUE / JOBS
    // ═══════════════════════════════════════════
    'queue-enqueue': {
      category: 'queue', operation: 'Enqueue Job',
      visual: 'Places task card onto moving conveyor belt',
      bubbles: ['task sent!', 'enqueuing...', 'into the queue!', 'job added'],
      prop: '📤', propColor: '#b44aff', stationGlow: '#b44aff',
      patterns: ['queue.add', 'enqueue', 'dispatch', 'publish', 'sendMessage', 'push'],
    },
    'queue-dequeue': {
      category: 'queue', operation: 'Dequeue/Process Job',
      visual: 'Picks task card off belt, rolls up sleeves',
      bubbles: ['my turn!', 'processing job...', 'let me work', 'dequeued!'],
      prop: '📥', propColor: '#b44aff', stationGlow: '#b44aff',
      patterns: ['queue.process', 'consume', 'receiveMessage', 'pull', 'worker.on'],
    },
    'queue-job-fail': {
      category: 'queue', operation: 'Job Failed',
      visual: 'Task card catches fire, character looks alarmed',
      bubbles: ['job failed!', 'task error!', 'couldn\'t process', 'oops!'],
      prop: '💥', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['job.failed', 'onFailed', 'dead_letter', 'DLQ', 'failedJob'],
    },
    'queue-job-retry': {
      category: 'queue', operation: 'Job Retry',
      visual: 'Picks up task card from reject pile, tries again',
      bubbles: ['retry #N...', 'one more try', 'back at it', 'not giving up!'],
      prop: '🔄', propColor: '#e07a3a', stationGlow: '#e07a3a',
      patterns: ['retry', 'requeue', 'attempts', 'backoff', 'retryCount'],
    },
    'queue-dead-letter': {
      category: 'queue', operation: 'Dead Letter Queue',
      visual: 'Solemnly carries failed task to a dark corner bin labeled DLQ',
      bubbles: ['to the DLQ...', 'permanently failed', 'dead letter', 'no more retries'],
      prop: '⚰️', propColor: '#888888', stationGlow: '#888888',
      patterns: ['deadLetter', 'DLQ', 'dead_letter_queue', 'permanentlyFailed'],
    },
    'queue-schedule': {
      category: 'queue', operation: 'Schedule Job',
      visual: 'Writes time on task card, places on calendar/timer shelf',
      bubbles: ['scheduled!', 'run later...', 'setting timer', 'delayed job'],
      prop: '📅', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['schedule', 'delay', 'cron', 'repeatInterval', 'runAt', 'delayed'],
    },

    // ═══════════════════════════════════════════
    // HTTP
    // ═══════════════════════════════════════════
    'http-request-in': {
      category: 'http', operation: 'Request Arrives',
      visual: 'Character bursts through factory entrance door',
      bubbles: ['incoming!', 'new request!', 'hello server!', 'knock knock!'],
      prop: '📨', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['request', 'req', 'incoming', 'handler'],
    },
    'http-response-ok': {
      category: 'http', operation: 'Response 200 OK',
      visual: 'Character exits factory carrying green checkmark paper',
      bubbles: ['200 OK!', 'all good!', 'success!', 'here you go!'],
      prop: '✅', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['res.json', 'res.send', 'return 200', 'response.ok'],
    },
    'http-redirect': {
      category: 'http', operation: 'Redirect',
      visual: 'Character hits a "DETOUR" sign, spins around to new direction',
      bubbles: ['wrong way!', 'redirecting...', '302 this way', 'follow me!'],
      prop: '↪️', propColor: '#e07a3a', stationGlow: '#e07a3a',
      patterns: ['redirect', 'res.redirect', 'return 301', 'return 302', 'Location:'],
    },
    'http-timeout': {
      category: 'http', operation: 'Request Timeout',
      visual: 'Character falls asleep waiting, alarm clock rings, runs away',
      bubbles: ['too slow!', 'timeout!', 'gave up waiting', 'zzz...WAKE UP!'],
      prop: '⏰', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['timeout', 'ETIMEDOUT', 'ECONNRESET', 'requestTimeout', 'AbortController'],
    },
    'http-upload': {
      category: 'http', operation: 'File Upload',
      visual: 'Character carries heavy box through entrance, sweating',
      bubbles: ['heavy load!', 'uploading...', 'big file!', 'almost there...'],
      prop: '📦', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['upload', 'multipart', 'multer', 'formData', 'putObject'],
    },

    // ═══════════════════════════════════════════
    // ERROR HANDLING
    // ═══════════════════════════════════════════
    'error-catch': {
      category: 'error', operation: 'Error Caught',
      visual: 'Character puts on hard hat, catches falling object',
      bubbles: ['caught it!', 'error handled', 'try/catch!', 'nice catch!'],
      prop: '⛑', propColor: '#e07a3a', stationGlow: '#e07a3a',
      patterns: ['catch', 'try', 'onError', 'errorHandler', 'handleError'],
    },
    'error-throw': {
      category: 'error', operation: 'Error Thrown',
      visual: 'Character throws red flaming ball that explodes',
      bubbles: ['EXCEPTION!', 'throw!', 'error thrown!', 'kaboom!'],
      prop: '💥', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['throw', 'raise', 'HTTPException', 'new Error', 'abort'],
    },
    'error-retry-backoff': {
      category: 'error', operation: 'Retry with Backoff',
      visual: 'Character bounces back, waits longer each time, tries again',
      bubbles: ['retry #1...', 'waiting longer...', 'exponential nap', 'try again...'],
      prop: '🔄', propColor: '#e07a3a', stationGlow: '#e07a3a',
      patterns: ['retry', 'backoff', 'exponentialBackoff', 'retryDelay', 'attempts'],
    },
    'error-circuit-breaker-open': {
      category: 'error', operation: 'Circuit Breaker Open',
      visual: 'Character pulls big red lever, conveyor stops, alarm light flashes',
      bubbles: ['CIRCUIT OPEN!', 'too many fails!', 'shutting down path', 'taking a break'],
      prop: '🚨', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['circuitBreaker', 'circuit_open', 'breaker.fire', 'halfOpen'],
    },
    'error-fallback': {
      category: 'error', operation: 'Fallback/Graceful Degradation',
      visual: 'Character shrugs, picks up smaller backup box from side shelf',
      bubbles: ['plan B!', 'fallback mode', 'good enough...', 'using backup'],
      prop: '🔀', propColor: '#ffd54a', stationGlow: '#ffd54a',
      patterns: ['fallback', 'default', 'degraded', 'graceful', 'failover'],
    },
    'error-panic': {
      category: 'error', operation: 'Panic/Crash',
      visual: 'Character bursts into flames, runs in circles, station shakes',
      bubbles: ['PANIC!', 'EVERYTHING IS FINE', 'CRASH!', 'this is fine 🔥'],
      prop: '🔥', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['panic', 'fatal', 'uncaughtException', 'SIGKILL', 'process.exit'],
    },

    // ═══════════════════════════════════════════
    // FILE / STORAGE
    // ═══════════════════════════════════════════
    'file-upload': {
      category: 'storage', operation: 'Upload to Storage',
      visual: 'Character lifts heavy box onto high shelf labeled S3',
      bubbles: ['uploading!', 'to the cloud!', 'storing file...', 'heavy lifting!'],
      prop: '☁️', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['putObject', 's3.upload', 'uploadFile', 'writeFile', 'storage.put'],
    },
    'file-download': {
      category: 'storage', operation: 'Download from Storage',
      visual: 'Character reaches to high shelf, pulls down box',
      bubbles: ['downloading!', 'fetching file', 'from the cloud', 'got it!'],
      prop: '📥', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['getObject', 's3.download', 'downloadFile', 'readFile', 'storage.get'],
    },
    'file-delete': {
      category: 'storage', operation: 'Delete File',
      visual: 'Character pushes box off shelf into shredder below',
      bubbles: ['shredding!', 'file deleted', 'off the shelf!', 'permanently gone'],
      prop: '🗑', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['deleteObject', 's3.delete', 'removeFile', 'unlink', 'storage.delete'],
    },
    'file-compress': {
      category: 'storage', operation: 'Compress/Zip',
      visual: 'Character squeezes big box down into tiny box',
      bubbles: ['squishing!', 'compressing...', 'making it tiny!', 'zip zip!'],
      prop: '📦', propColor: '#b44aff', stationGlow: '#b44aff',
      patterns: ['compress', 'gzip', 'zip', 'deflate', 'archiver', 'tar'],
    },

    // ═══════════════════════════════════════════
    // EMAIL / NOTIFICATIONS
    // ═══════════════════════════════════════════
    'email-send': {
      category: 'email', operation: 'Send Email',
      visual: 'Character folds letter, puts in envelope, drops in mailbox',
      bubbles: ['mail sent!', 'sending email...', 'letter posted!', 'check inbox!'],
      prop: '✉️', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['sendEmail', 'sendMail', 'nodemailer', 'smtp', 'transporter.send'],
    },
    'email-bounce': {
      category: 'email', operation: 'Email Bounce',
      visual: 'Letter flies back from mailbox and hits character in face',
      bubbles: ['bounced!', 'undeliverable!', 'bad address!', 'return to sender'],
      prop: '↩️', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['bounce', 'undeliverable', 'SMTP error', 'rejected'],
    },
    'notification-push': {
      category: 'email', operation: 'Push Notification',
      visual: 'Character rings tiny bell, sound waves radiate out',
      bubbles: ['ding!', 'notification sent', 'alerting user', 'push!'],
      prop: '🔔', propColor: '#ffd54a', stationGlow: '#ffd54a',
      patterns: ['pushNotification', 'notify', 'sendNotification', 'FCM', 'APNs'],
    },
    'notification-slack': {
      category: 'email', operation: 'Slack Message',
      visual: 'Character types on tiny keyboard, message bubble appears',
      bubbles: ['slacking!', 'message sent', 'team notified', '#channel update'],
      prop: '💬', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['slack', 'postMessage', 'webhook.send', 'chatPostMessage', 'slackBot'],
    },

    // ═══════════════════════════════════════════
    // ENCRYPTION / SECURITY
    // ═══════════════════════════════════════════
    'crypto-encrypt': {
      category: 'security', operation: 'Encrypt Data',
      visual: 'Character wraps document in chains and locks it',
      bubbles: ['locking up!', 'encrypting...', 'top secret!', 'under lock & key'],
      prop: '🔒', propColor: '#b44aff', stationGlow: '#b44aff',
      patterns: ['encrypt', 'cipher', 'AES', 'createCipheriv', 'encryptionKey'],
    },
    'crypto-decrypt': {
      category: 'security', operation: 'Decrypt Data',
      visual: 'Character unlocks chains, unwraps document',
      bubbles: ['unlocking!', 'decrypting...', 'revealed!', 'readable again'],
      prop: '🔓', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['decrypt', 'decipher', 'createDecipheriv', 'decryptionKey'],
    },
    'crypto-sign': {
      category: 'security', operation: 'Sign JWT/Document',
      visual: 'Character dips quill in ink, signs with flourish',
      bubbles: ['signing!', 'jwt.sign()', 'sealed!', 'my signature'],
      prop: '✒️', propColor: '#ffd54a', stationGlow: '#ffd54a',
      patterns: ['jwt.sign', 'sign', 'createToken', 'generateToken', 'signPayload'],
    },
    'crypto-verify-sig': {
      category: 'security', operation: 'Verify Signature',
      visual: 'Character compares signature on document against reference',
      bubbles: ['checking sig...', 'is this genuine?', 'signature valid!', 'verified!'],
      prop: '🔍', propColor: '#88ffcc', stationGlow: '#88ffcc',
      patterns: ['verify', 'verifySignature', 'validateSignature', 'svix.verify', 'webhookVerify'],
    },

    // ═══════════════════════════════════════════
    // RATE LIMITING
    // ═══════════════════════════════════════════
    'ratelimit-allow': {
      category: 'ratelimit', operation: 'Rate Limit: Allowed',
      visual: 'Character passes through gate, guard waves through',
      bubbles: ['you may pass', 'within limits', 'approved!', 'go ahead!'],
      prop: '✅', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['rateLimit', 'rateLimiter', 'checkLimit', 'slidingWindow'],
    },
    'ratelimit-block': {
      category: 'ratelimit', operation: 'Rate Limit: Blocked',
      visual: 'Guard holds up STOP sign, character bounces back sadly',
      bubbles: ['BLOCKED!', '429!', 'too many!', 'slow down!', 'rate limited!'],
      prop: '🛑', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['429', 'too_many_requests', 'rateLimited', 'exceeded'],
    },
    'ratelimit-throttle': {
      category: 'ratelimit', operation: 'Rate Limit: Throttled',
      visual: 'Character slows to a crawl through thick molasses',
      bubbles: ['slowing down...', 'throttled!', 'taking it easy', 'speed limit'],
      prop: '🐌', propColor: '#e07a3a', stationGlow: '#e07a3a',
      patterns: ['throttle', 'slowDown', 'backpressure', 'rateLimitDelay'],
    },

    // ═══════════════════════════════════════════
    // WEBHOOKS
    // ═══════════════════════════════════════════
    'webhook-receive': {
      category: 'webhook', operation: 'Receive Webhook',
      visual: 'Character catches incoming package thrown over factory wall',
      bubbles: ['incoming hook!', 'webhook received', 'external event!', 'delivery!'],
      prop: '📬', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['webhook', 'POST /webhook', 'handleWebhook', 'webhookHandler'],
    },
    'webhook-validate': {
      category: 'webhook', operation: 'Validate Webhook Signature',
      visual: 'Character inspects package seal with magnifying glass',
      bubbles: ['seal intact?', 'validating...', 'checking signature', 'legit package!'],
      prop: '🔍', propColor: '#88ffcc', stationGlow: '#88ffcc',
      patterns: ['webhookSecret', 'verifyWebhook', 'WEBHOOK_SECRET', 'svix', 'stripe.webhooks'],
    },

    // ═══════════════════════════════════════════
    // WEBSOCKET
    // ═══════════════════════════════════════════
    'ws-connect': {
      category: 'websocket', operation: 'WebSocket Connect',
      visual: 'Character plugs cable into socket, light turns green',
      bubbles: ['connected!', 'socket open', 'real-time!', 'plugged in!'],
      prop: '🔌', propColor: '#4af5ff', stationGlow: '#4af5ff',
      patterns: ['WebSocket', 'ws.on("connection")', 'socket.io', 'upgrade', 'onopen'],
    },
    'ws-broadcast': {
      category: 'websocket', operation: 'Broadcast Message',
      visual: 'Character shouts through megaphone, waves radiate to all',
      bubbles: ['broadcasting!', 'to everyone!', 'ATTENTION!', 'all channels!'],
      prop: '📢', propColor: '#b44aff', stationGlow: '#b44aff',
      patterns: ['broadcast', 'emit', 'io.emit', 'ws.clients.forEach', 'publishAll'],
    },
    'ws-disconnect': {
      category: 'websocket', operation: 'WebSocket Disconnect',
      visual: 'Character unplugs cable, light turns red',
      bubbles: ['disconnected', 'socket closed', 'goodbye!', 'unplugged'],
      prop: '🔌', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['disconnect', 'close', 'onclose', 'socket.destroy'],
    },

    // ═══════════════════════════════════════════
    // LOGGING / MONITORING
    // ═══════════════════════════════════════════
    'log-write': {
      category: 'logging', operation: 'Write Log',
      visual: 'Character scribbles in tiny logbook',
      bubbles: ['noting...', 'logged!', 'for the record', 'writing it down'],
      prop: '📓', propColor: '#88ffcc', stationGlow: '#88ffcc',
      patterns: ['logger', 'console.log', 'log.info', 'log.error', 'log.warn', 'winston'],
    },
    'log-alert': {
      category: 'logging', operation: 'Fire Alert',
      visual: 'Character pulls alarm cord, red light flashes',
      bubbles: ['ALERT!', 'alarm triggered!', 'paging on-call!', 'wake up team!'],
      prop: '🚨', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['alert', 'pagerduty', 'sendAlert', 'critical', 'sentry.capture'],
    },
    'log-metric': {
      category: 'logging', operation: 'Record Metric',
      visual: 'Character taps number into calculator, charts appear',
      bubbles: ['measuring!', 'metric recorded', 'stats updated', 'data point!'],
      prop: '📊', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['metric', 'prometheus', 'statsd', 'gauge', 'counter.inc', 'histogram'],
    },
    'log-health-check': {
      category: 'logging', operation: 'Health Check',
      visual: 'Character holds stethoscope to server, gives thumbs up',
      bubbles: ['still alive!', 'health: OK', 'heartbeat!', 'feeling good!'],
      prop: '💚', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['health', 'healthcheck', 'GET /health', 'ping', 'liveness', 'readiness'],
    },

    // ═══════════════════════════════════════════
    // CRON / SCHEDULED
    // ═══════════════════════════════════════════
    'cron-tick': {
      category: 'cron', operation: 'Cron Job Trigger',
      visual: 'Clock strikes, character wakes up from nap on bench',
      bubbles: ['time to work!', 'cron triggered!', 'alarm ringing!', 'scheduled run'],
      prop: '⏰', propColor: '#ffd54a', stationGlow: '#ffd54a',
      patterns: ['cron', 'schedule', 'setInterval', 'node-cron', 'agenda', 'repeatEvery'],
    },
    'cron-skip': {
      category: 'cron', operation: 'Skip (Already Running)',
      visual: 'Character checks "BUSY" sign on door, shrugs, goes back to sleep',
      bubbles: ['already running', 'skip this one', 'next time...', 'busy busy'],
      prop: '💤', propColor: '#888888', stationGlow: '#888888',
      patterns: ['already_running', 'lock.acquire', 'skipDuplicate', 'overlap'],
    },

    // ═══════════════════════════════════════════
    // SEARCH
    // ═══════════════════════════════════════════
    'search-index': {
      category: 'search', operation: 'Index Document',
      visual: 'Character stamps document and files in organized card catalog',
      bubbles: ['indexing!', 'cataloged!', 'now searchable', 'filed under...'],
      prop: '🗂', propColor: '#ffd54a', stationGlow: '#ffd54a',
      patterns: ['index', 'elasticsearch', 'algolia', 'reindex', 'indexDocument'],
    },
    'search-query': {
      category: 'search', operation: 'Search Query',
      visual: 'Character peers through magnifying glass at card catalog',
      bubbles: ['searching...', 'looking for...', 'found matches!', 'query running'],
      prop: '🔍', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['search', 'query', 'fullTextSearch', 'elasticsearch.search', 'findMany'],
    },

    // ═══════════════════════════════════════════
    // PAYMENT
    // ═══════════════════════════════════════════
    'payment-charge': {
      category: 'payment', operation: 'Charge Card',
      visual: 'Character swipes card through tiny register, coins fly out',
      bubbles: ['ka-ching!', 'payment accepted!', 'charging card...', 'money in!'],
      prop: '💳', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['stripe.charges', 'paymentIntent', 'charge', 'processPayment', 'checkout'],
    },
    'payment-refund': {
      category: 'payment', operation: 'Refund',
      visual: 'Character reluctantly pushes coins back through counter window',
      bubbles: ['refunding...', 'money back!', 'here you go...', 'refund issued'],
      prop: '💸', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['refund', 'stripe.refunds', 'reverseCharge', 'creditBack'],
    },
    'payment-subscribe': {
      category: 'payment', operation: 'Create Subscription',
      visual: 'Character signs recurring contract with tiny pen, calendar appears',
      bubbles: ['subscribed!', 'recurring!', 'see you monthly', 'auto-billing set'],
      prop: '📅', propColor: '#b44aff', stationGlow: '#b44aff',
      patterns: ['subscription', 'subscribe', 'recurringPayment', 'stripe.subscriptions'],
    },

    // ═══════════════════════════════════════════
    // EXTERNAL API
    // ═══════════════════════════════════════════
    'api-outbound': {
      category: 'external_api', operation: 'Call External API',
      visual: 'Character picks up phone, dials, waits for answer',
      bubbles: ['calling out...', 'external API!', 'ringing...', 'waiting for reply'],
      prop: '📞', propColor: '#e07a3a', stationGlow: '#e07a3a',
      patterns: ['fetch', 'axios', 'http.get', 'request', 'externalApi', 'thirdParty'],
    },
    'api-timeout-waiting': {
      category: 'external_api', operation: 'API Timeout',
      visual: 'Character taps foot impatiently, clock spins, hangs up phone',
      bubbles: ['no answer!', 'timed out!', 'too slow!', 'hanging up!'],
      prop: '⏰', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['timeout', 'ETIMEDOUT', 'ECONNREFUSED', 'AbortError'],
    },
    'api-parse-response': {
      category: 'external_api', operation: 'Parse API Response',
      visual: 'Character unfolds received telegram, reads it carefully',
      bubbles: ['reading reply...', 'parsing JSON...', 'what\'d they say?', 'decoding...'],
      prop: '📜', propColor: '#88ffcc', stationGlow: '#88ffcc',
      patterns: ['res.json()', 'JSON.parse', 'parseResponse', 'response.data'],
    },

    // ═══════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════
    'validate-pass': {
      category: 'validation', operation: 'Validation Passed',
      visual: 'Character stamps document with big green checkmark',
      bubbles: ['looks good!', 'valid!', 'approved!', 'schema match!'],
      prop: '✅', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['validate', 'zod', 'joi', 'yup', 'schema.parse', 'isValid'],
    },
    'validate-fail': {
      category: 'validation', operation: 'Validation Failed',
      visual: 'Character stamps document with big red X, throws it back',
      bubbles: ['invalid!', 'bad data!', 'rejected!', 'schema mismatch!'],
      prop: '❌', propColor: '#ff4a4a', stationGlow: '#ff4a4a',
      patterns: ['ValidationError', 'invalid', 'schema.safeParse', '400 Bad Request'],
    },
    'validate-sanitize': {
      category: 'validation', operation: 'Sanitize Input',
      visual: 'Character scrubs document with tiny sponge, dirt comes off',
      bubbles: ['cleaning up!', 'sanitizing...', 'scrub scrub', 'safe now!'],
      prop: '🧽', propColor: '#4af5ff', stationGlow: '#4af5ff',
      patterns: ['sanitize', 'escape', 'DOMPurify', 'xss', 'stripTags', 'trim'],
    },

    // ═══════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════
    'serialize-encode': {
      category: 'serialization', operation: 'JSON Encode',
      visual: 'Character wraps messy objects neatly into a JSON box',
      bubbles: ['packaging!', 'JSON.stringify', 'wrapping up', 'serialized!'],
      prop: '📦', propColor: '#4a9eff', stationGlow: '#4a9eff',
      patterns: ['JSON.stringify', 'serialize', 'encode', 'marshal', 'toJSON'],
    },
    'serialize-decode': {
      category: 'serialization', operation: 'JSON Decode',
      visual: 'Character opens JSON box, objects spill out organized',
      bubbles: ['unpacking!', 'JSON.parse', 'unwrapping', 'deserialized!'],
      prop: '📦', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['JSON.parse', 'deserialize', 'decode', 'unmarshal', 'fromJSON'],
    },
    'serialize-transform': {
      category: 'serialization', operation: 'Data Transform/Map',
      visual: 'Character feeds document through machine, different shape comes out',
      bubbles: ['transforming!', 'mapping data', 'shape shift!', 'new format!'],
      prop: '🔀', propColor: '#b44aff', stationGlow: '#b44aff',
      patterns: ['transform', 'map', 'reduce', 'aggregate', 'reshape', 'DTO'],
    },

    // ═══════════════════════════════════════════
    // CONFIG / DEPLOY
    // ═══════════════════════════════════════════
    'config-env-load': {
      category: 'config', operation: 'Load Environment',
      visual: 'Character opens toolbox, reads instruction manual',
      bubbles: ['loading config!', 'reading .env', 'setting up!', 'env loaded'],
      prop: '⚙️', propColor: '#88ffcc', stationGlow: '#88ffcc',
      patterns: ['dotenv', 'process.env', 'config', 'env.load', 'configService'],
    },
    'config-feature-flag': {
      category: 'config', operation: 'Feature Flag Check',
      visual: 'Character flips a tiny switch, checks if light turns on',
      bubbles: ['flag check!', 'enabled?', 'feature on!', 'toggle time'],
      prop: '🏁', propColor: '#ffd54a', stationGlow: '#ffd54a',
      patterns: ['featureFlag', 'feature_flag', 'isEnabled', 'launchDarkly', 'unleash', 'flagsmith'],
    },
    'config-health-probe': {
      category: 'config', operation: 'Health/Readiness Probe',
      visual: 'Character holds up green/red card to k8s inspector',
      bubbles: ['I\'m ready!', 'all systems go', 'probe passed', 'healthy!'],
      prop: '💚', propColor: '#4aff7f', stationGlow: '#4aff7f',
      patterns: ['readiness', 'liveness', '/healthz', '/ready', 'probe'],
    },
  };

  // ═══════════════════════════════════════════
  // SCENARIO MATCHER
  // Agents set scenario IDs on actions/nodes.
  // This also provides a fallback pattern-matching
  // approach for when agents don't set explicit scenarios.
  // ═══════════════════════════════════════════

  function matchScenario(text) {
    if (!text) return null;
    const lower = text.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const [id, scenario] of Object.entries(SCENARIOS)) {
      let score = 0;
      for (const pattern of scenario.patterns) {
        if (lower.includes(pattern.toLowerCase())) {
          score += pattern.length; // longer matches are more specific
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = id;
      }
    }
    return bestMatch;
  }

  function getScenario(id) {
    return SCENARIOS[id] || null;
  }

  function getScenarioBubble(id) {
    const s = SCENARIOS[id];
    if (!s) return null;
    return s.bubbles[Math.floor(Math.random() * s.bubbles.length)];
  }

  function getAllScenarioIds() {
    return Object.keys(SCENARIOS);
  }

  function getScenariosByCategory(category) {
    return Object.entries(SCENARIOS)
      .filter(([, s]) => s.category === category)
      .map(([id, s]) => ({ id, ...s }));
  }

  // ═══════════════════════════════════════════
  // EXPORTS
  // ═══════════════════════════════════════════
  window.Scenarios = {
    SCENARIOS,
    matchScenario,
    getScenario,
    getScenarioBubble,
    getAllScenarioIds,
    getScenariosByCategory,
  };

})();
