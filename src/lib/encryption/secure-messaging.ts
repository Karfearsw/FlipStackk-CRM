import crypto from 'crypto';

export interface EncryptedMessage {
  encryptedData: string;
  iv: string;
  algorithm: string;
  keyId?: string;
}

export interface EncryptionKey {
  id: string;
  key: string;
  createdAt: Date;
  expiresAt?: Date;
}

export class MessageEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  // Generate a new encryption key
  static generateKey(): EncryptionKey {
    const key = crypto.randomBytes(this.KEY_LENGTH).toString('base64');
    return {
      id: crypto.randomUUID(),
      key,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  // Encrypt a message
  static encryptMessage(plaintext: string, key: string): EncryptedMessage {
    try {
      // Convert base64 key to buffer
      const keyBuffer = Buffer.from(key, 'base64');
      
      // Generate random IV
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      // Create cipher
      const cipher = crypto.createCipher(this.ALGORITHM, keyBuffer);
      
      // Encrypt the message
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Get the authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine encrypted data and tag
      const encryptedData = encrypted + ':' + tag.toString('base64');
      
      return {
        encryptedData,
        iv: iv.toString('base64'),
        algorithm: this.ALGORITHM,
        keyId: crypto.randomUUID()
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Decrypt a message
  static decryptMessage(encryptedMessage: EncryptedMessage, key: string): string {
    try {
      // Convert base64 key to buffer
      const keyBuffer = Buffer.from(key, 'base64');
      
      // Extract IV
      const iv = Buffer.from(encryptedMessage.iv, 'base64');
      
      // Split encrypted data and tag
      const [encryptedData, tagBase64] = encryptedMessage.encryptedData.split(':');
      const tag = Buffer.from(tagBase64, 'base64');
      
      // Create decipher
      const decipher = crypto.createDecipher(this.ALGORITHM, keyBuffer);
      
      // Set the authentication tag
      decipher.setAuthTag(tag);
      
      // Decrypt the message
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate a key pair for asymmetric encryption (for key exchange)
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  // Encrypt a symmetric key with RSA public key
  static encryptKey(symmetricKey: string, publicKey: string): string {
    try {
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(symmetricKey, 'base64')
      );

      return encrypted.toString('base64');
    } catch (error) {
      throw new Error(`Key encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Decrypt a symmetric key with RSA private key
  static decryptKey(encryptedKey: string, privateKey: string): string {
    try {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(encryptedKey, 'base64')
      );

      return decrypted.toString('base64');
    } catch (error) {
      throw new Error(`Key decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate a shared secret using Diffie-Hellman
  static generateSharedSecret(otherPublicKey: string, privateKey: string): string {
    try {
      const privateKeyObject = crypto.createPrivateKey({
        key: Buffer.from(privateKey, 'base64'),
        format: 'der',
        type: 'pkcs8'
      });
      
      const publicKeyObject = crypto.createPublicKey({
        key: Buffer.from(otherPublicKey, 'base64'),
        format: 'der',
        type: 'spki'
      });

      const sharedSecret = crypto.diffieHellman({
        privateKey: privateKeyObject,
        publicKey: publicKeyObject
      });

      return sharedSecret.toString('base64');
    } catch (error) {
      throw new Error(`Shared secret generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Hash a message for integrity verification
  static hashMessage(message: string): string {
    return crypto.createHash('sha256').update(message).digest('base64');
  }

  // Verify message integrity
  static verifyMessageIntegrity(message: string, expectedHash: string): boolean {
    const actualHash = this.hashMessage(message);
    return actualHash === expectedHash;
  }

  // Generate a digital signature
  static signMessage(message: string, privateKey: string): string {
    try {
      const signature = crypto.sign(
        'sha256',
        Buffer.from(message, 'utf8'),
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
        }
      );

      return signature.toString('base64');
    } catch (error) {
      throw new Error(`Message signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Verify a digital signature
  static verifySignature(message: string, signature: string, publicKey: string): boolean {
    try {
      return crypto.verify(
        'sha256',
        Buffer.from(message, 'utf8'),
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
        },
        Buffer.from(signature, 'base64')
      );
    } catch (error) {
      return false;
    }
  }

  // Check if a key has expired
  static isKeyExpired(key: EncryptionKey): boolean {
    if (!key.expiresAt) return false;
    return new Date() > key.expiresAt;
  }

  // Rotate encryption keys
  static rotateKey(currentKey: EncryptionKey): EncryptionKey {
    if (this.isKeyExpired(currentKey)) {
      return this.generateKey();
    }
    return currentKey;
  }
}

export class SecureMessageManager {
  private keys: Map<string, EncryptionKey> = new Map();
  private keyPairs: Map<string, { publicKey: string; privateKey: string }> = new Map();

  // Initialize secure messaging for a user
  initializeUserSecurity(userId: string): { publicKey: string; keyId: string } {
    // Generate key pair for asymmetric encryption
    const keyPair = MessageEncryption.generateKeyPair();
    this.keyPairs.set(userId, keyPair);

    // Generate symmetric key for message encryption
    const symmetricKey = MessageEncryption.generateKey();
    this.keys.set(userId, symmetricKey);

    return {
      publicKey: keyPair.publicKey,
      keyId: symmetricKey.id
    };
  }

  // Encrypt a message for a specific user
  encryptMessageForUser(userID: string, message: string): EncryptedMessage {
    const key = this.keys.get(userID);
    if (!key) {
      throw new Error(`No encryption key found for user ${userID}`);
    }

    if (MessageEncryption.isKeyExpired(key)) {
      throw new Error(`Encryption key has expired for user ${userID}`);
    }

    return MessageEncryption.encryptMessage(message, key.key);
  }

  // Decrypt a message for a specific user
  decryptMessageForUser(userID: string, encryptedMessage: EncryptedMessage): string {
    const key = this.keys.get(userID);
    if (!key) {
      throw new Error(`No encryption key found for user ${userID}`);
    }

    return MessageEncryption.decryptMessage(encryptedMessage, key.key);
  }

  // Get user's public key for secure communication
  getUserPublicKey(userID: string): string {
    const keyPair = this.keyPairs.get(userID);
    if (!keyPair) {
      throw new Error(`No key pair found for user ${userID}`);
    }

    return keyPair.publicKey;
  }

  // Rotate user's encryption key
  rotateUserKey(userID: string): EncryptionKey {
    const currentKey = this.keys.get(userID);
    if (!currentKey) {
      throw new Error(`No encryption key found for user ${userID}`);
    }

    const newKey = MessageEncryption.rotateKey(currentKey);
    this.keys.set(userID, newKey);

    return newKey;
  }

  // Securely exchange keys between users
  exchangeKeys(senderID: string, recipientID: string): { encryptedKey: string; signature: string } {
    const senderKeyPair = this.keyPairs.get(senderID);
    const recipientPublicKey = this.getUserPublicKey(recipientID);
    const senderSymmetricKey = this.keys.get(senderID);

    if (!senderKeyPair || !senderSymmetricKey) {
      throw new Error('Missing keys for secure key exchange');
    }

    // Encrypt the symmetric key with recipient's public key
    const encryptedKey = MessageEncryption.encryptKey(senderSymmetricKey.key, recipientPublicKey);

    // Sign the encrypted key with sender's private key
    const signature = MessageEncryption.signMessage(encryptedKey, senderKeyPair.privateKey);

    return { encryptedKey, signature };
  }

  // Verify and decrypt a received key
  verifyAndDecryptKey(senderID: string, encryptedKey: string, signature: string): string {
    const senderPublicKey = this.getUserPublicKey(senderID);
    const recipientKeyPair = this.keyPairs.get(senderID); // Assuming this is called by recipient

    if (!recipientKeyPair) {
      throw new Error('Missing recipient key pair');
    }

    // Verify the signature
    const isValid = MessageEncryption.verifySignature(encryptedKey, signature, senderPublicKey);
    if (!isValid) {
      throw new Error('Invalid signature on encrypted key');
    }

    // Decrypt the key
    return MessageEncryption.decryptKey(encryptedKey, recipientKeyPair.privateKey);
  }
}