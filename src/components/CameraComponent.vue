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
import config from '../config'

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
                        frameRate: { ideal: 60, max: 60, min: 30 },
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
            try {
                await this.sleep(1000)
                this.progress = 60
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = this.$refs.cameraFeed.videoWidth;
                canvas.height = this.$refs.cameraFeed.videoHeight;
                context.drawImage(this.$refs.cameraFeed, 0, 0, canvas.width, canvas.height);
                const image = canvas.toDataURL('image/jpeg');
                const response = await fetch(config.backendURL + '/represent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ img: image, model_name: 'Facenet' })
                });

                if (!response.ok) {
                    console.error('Error calling DeepFace API', response.statusText);
                    return;
                }

                const results = await response.json();
                const embeddings = results.results[0]


                this.progress = 100

                await this.stopCamera();
                this.$emit('image-captured', embeddings.embedding);
            } catch (e) {
                alert(e.message)
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