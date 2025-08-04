// helper/util/imageUtils.js - Image processing and upload utilities
const axios = require('axios');

async function convertDalleImageToPinata(dalleImageUrl) {
  try {
    // Download the image from DALL-E
    const imageResponse = await fetch(dalleImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch DALL-E image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    // Convert to Buffer
    const buffer = Buffer.from(imageBuffer);

    // Optional: Resize image using Sharp if available
    let processedBuffer = buffer;
    try {
      const sharp = require('sharp');
      processedBuffer = await sharp(buffer)
        .resize(512, 512, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({
          quality: 90,
          compressionLevel: 6
        })
        .toBuffer();
    } catch (sharpError) {
      console.log('⚠️ Sharp not available or error, using original size:', sharpError.message);
      processedBuffer = buffer;
    }

    // Upload to Pinata using axios (more reliable than fetch for FormData)
    console.log('☁️ Uploading to Pinata...');
    const FormData = require('form-data');
    const formData = new FormData();

    // Add file with proper options
    formData.append('file', processedBuffer, {
      filename: `game-image-${Date.now()}.png`,
      contentType: 'image/png'
    });

    // Add metadata (optional)
    const metadata = JSON.stringify({
      name: `Game Image ${Date.now()}`,
      keyvalues: {
        type: 'game-image',
        source: 'dalle-generated',
        timestamp: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Add options (optional)
    const options = JSON.stringify({
      cidVersion: 0
    });
    formData.append('pinataOptions', options);

    // Use axios instead of fetch for better FormData handling
    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PINATA_JWT}`,
          ...formData.getHeaders() // This is crucial for proper boundary setting
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000 // 60 second timeout
      }
    );

    const pinataData = pinataResponse.data;
    const finalImageUrl = `https://gateway.pinata.cloud/ipfs/${pinataData.IpfsHash}`;

    console.log('✅ Successfully uploaded to Pinata');
    console.log('IPFS Hash:', pinataData.IpfsHash);
    console.log('Final URL:', finalImageUrl);

    return finalImageUrl;

  } catch (error) {
    console.error('❌ Error converting DALL-E image to Pinata:', error);

    // Log more details about the error
    if (error.response) {
      console.error('Pinata API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }

    throw new Error(`Failed to convert DALL-E image: ${error.message}`);
  }
}

module.exports = {
  convertDalleImageToPinata
};