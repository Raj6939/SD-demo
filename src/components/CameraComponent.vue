<template>
    <v-container class="d-flex justify-center" style="width: 100%; height: 100%;">
        <global-loader :isLoading="isLoading" />
        <!-- progress bar -->
        <v-card class="mx-auto mt-0 fill-height" style="width: 100%; height: 100vh ;">

            <v-card-text class="d-flex justify-center">
                <!-- Round responsive camera viewer -->

                <video :class="{ 'animate-border': isCameraActive }" ref="cameraFeed" autoplay playsinline
                    class="camera-view"></video>

            </v-card-text>

            <v-card-actions class="d-flex justify-center mt-4">
                <v-btn v-if="stream == null" prepend-icon="mdi-camera" color="primary" class="mr-2"
                    @click="startCamera">Start</v-btn>
                <v-btn v-else prepend-icon="mdi-camera-off" color="error" @click="stopCamera">Stop</v-btn>
                <v-btn v-if="isCameraActive" prepend-icon="mdi-camera" color="primary" class="ml-2"
                    @click="captureImage">Capture</v-btn>

            </v-card-actions>
            <v-card-text class="d-flex justify-center" v-if="isCameraActive">
                <v-progress-circular :model-value="progress" size="30" color="primary" />
            </v-card-text>
        </v-card>

    </v-container>
</template>

<script>

import GlobalLoader from './LoaderComponent.vue';
import * as tf from '@tensorflow/tfjs'
import * as blazeFace from '@tensorflow-models/blazeface'
import * as mobileNet from '@tensorflow-models/mobilenet'

export default {
    name: 'CameraComponent',
    components: { GlobalLoader },
    emits: ['image-captured'],

    data() {
        return {
            stream: null,
            isLoading: false,
            isCameraActive: false,
            model: null,
            detectionLoop: null,
            progress: 0
        };
    },
    methods: {
        async startCamera() {
            this.isLoading = true;
            try {
                // Access the camera
                this.stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280, max: 1920 },
                        height: { ideal: 720, max: 1080 },
                        frameRate: { ideal: 30, max: 60 },
                        facingMode: "user",
                        aspectRatio: { ideal: 16 / 9 },
                        resizeMode: "crop-and-scale"
                    }
                });

                // Set the video source
                this.$refs.cameraFeed.srcObject = this.stream;
                this.isCameraActive = true;
                this.progress = 10
                // await this.captureImage();


            } catch (error) {
                console.error('Error accessing the camera', error);
            } finally {
                this.isLoading = false;
            }
        },
        async sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        async captureImage() {
            await this.sleep(1000)
            this.progress = 60
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = this.$refs.cameraFeed.videoWidth;
            canvas.height = this.$refs.cameraFeed.videoHeight;
            context.drawImage(this.$refs.cameraFeed, 0, 0, canvas.width, canvas.height);
            // const image = canvas.toDataURL('image/jpeg');
            // display image
            // const imgElement = document.createElement('img');
            // imgElement.src = image;
            // imgElement.style.width = '200px';
            // imgElement.style.height = '200px'

            // imgElement.style.borderRadius = '50%';
            // document.querySelector('.d-flex.justify-center').appendChild(imgElement);

            const embeddingModel = await mobileNet.load();
            const faceModel = await blazeFace.load();
            this.progress = 95
            console.log('MobileNet model loaded');


            const inputTensor = tf.browser.fromPixels(canvas);
            const predictions = await faceModel.estimateFaces(inputTensor, false)
            console.log(predictions);


            if (predictions.length === 0) {
                alert('No faces detected.');
                return this.stopCamera()

            }

            const embeddings = []
            for (let i = 0; i < predictions.length; i++) {
                const face = predictions[i];
                let [x, y] = face.topLeft.map(Math.floor); // Top-left corner of the bounding box
                console.log(predictions);

                let [width, height] = face.bottomRight.map((v, idx) => Math.floor(v - face.topLeft[idx])); // Width and height of the bounding box


                const padding = 10;
                x = Math.max(0, x - padding);
                y = Math.max(0, y - padding);
                width = Math.min(canvas.width - x, width + 2 * padding);
                height = Math.min(canvas.height - y, height + 2 * padding);

                const faceCanvas = document.createElement('canvas');
                const faceCtx = faceCanvas.getContext('2d');
                faceCanvas.width = width;
                faceCanvas.height = height;
                faceCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
                console.log(faceCanvas.toDataURL('image/jpeg'));

                const imgElement = document.createElement('img');
                imgElement.src = faceCanvas.toDataURL('image/jpeg');
                document.querySelector('.d-flex.justify-center').appendChild(imgElement);

                // Create a tensor from the cropped face image, resize, and normalize
                const faceTensor = tf.browser.fromPixels(faceCanvas)

                // Generate face embedding using the embedding model
                const embedding = await embeddingModel.infer(faceTensor, { pooling: 'avg' }).arraySync()[0];
                console.log(embedding);

                // Push the results including face embedding and bounding box
                embeddings.push({
                    faceIndex: i,
                    embedding,
                    boundingBox: { x, y, width, height },
                    landmarks: face.landmarks, // Include facial landmarks if necessary
                    probability: face.probability[0] // Confidence score of the face detection
                });

                console.log(embeddings);


                this.progress = 100

                await this.stopCamera();
                this.$emit('image-captured', embeddings[0].embedding);


            }
        }

        ,

        stopCamera() {
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.$refs.cameraFeed.srcObject = null;
                this.stream = null;
                this.isCameraActive = false;
            }
        }
    }

};
</script>

<style scoped>
.camera-view {
    width: 100%;
    max-width: 300px;
    max-height: 300px;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 50%;
    /* Initial transparent border */
    border: 4px solid #4caf50;
    /* Green top border */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    position: relative;
    transition: 0.3s ease-in-out;

}

.camera-view.animate-border {


    animation: glow-border 10s linear infinite, rotate 10s linear infinite;
    /* Continuous rotate and glow */
}

/* Keyframes for rotating and glowing border effect */
@keyframes glow-border {
    0% {
        border-color: hsl(0, 100%, 50%);
        /* Red */
        box-shadow: 0 0 10px hsl(0, 100%, 50%), 0 0 20px hsl(0, 100%, 50%);
    }

    25% {
        border-color: hsl(90, 100%, 50%);
        /* Green */
        box-shadow: 0 0 10px hsl(90, 100%, 50%), 0 0 20px hsl(90, 100%, 50%);
    }

    50% {
        border-color: hsl(180, 100%, 50%);
        /* Blue */
        box-shadow: 0 0 10px hsl(180, 100%, 50%), 0 0 20px hsl(180, 100%, 50%);
    }

    75% {
        border-color: hsl(270, 100%, 50%);
        /* Purple */
        box-shadow: 0 0 10px hsl(270, 100%, 50%), 0 0 20px hsl(270, 100%, 50%);
    }

    100% {
        border-color: hsl(0, 100%, 50%);
        /* Red */
        box-shadow: 0 0 10px hsl(0, 100%, 50%), 0 0 20px hsl(0, 100%, 50%);
    }
}


/* Ensure responsive container for mobile view */
.v-card {
    padding: 16px;
    text-align: center;
}

@media screen and (max-width: 600px) {
    .camera-view {
        max-width: 200px;
        max-height: 200px;
    }

    v-btn {
        font-size: 14px;
    }
}

.camera-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    max-width: 300px;
    max-height: 300px;
    pointer-events: none;
}
</style>