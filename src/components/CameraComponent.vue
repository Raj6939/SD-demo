<template>
    <v-container class="d-flex justify-center" style="width: 100%; height: 100%;">
        <global-loader :isLoading="isLoading" />

        <v-card class="mx-auto mt-0 fill-height" style="width: 100%; height: 100vh;">
            <!-- QR Code Scanner -->
            <v-card-actions class="d-flex justify-center mt-4">
                <v-btn color="primary" @click="scanQRCode">Scan QR</v-btn>
            </v-card-actions>

            <v-card-text class="d-flex justify-center" v-if="step === 1">
                <video ref="cameraFeed" autoplay playsinline class="camera-view"></video>
                <div v-if="isScanning" class="scanner-overlay"></div>
            </v-card-text>

            <v-card-actions class="d-flex justify-center mt-4" v-if="step === 1">
                <v-btn v-if="!isCameraActive" prepend-icon="mdi-camera" color="primary" class="mr-2"
                    @click="startCamera">Start</v-btn>
                <v-btn v-else prepend-icon="mdi-camera-off" color="error" @click="stopCamera">Stop</v-btn>
                <v-btn v-if="isCameraActive" prepend-icon="mdi-camera" color="primary" class="ml-2"
                    @click="captureImage">Capture</v-btn>
            </v-card-actions>

            <v-card-text v-if="step === 2">
                <v-form ref="userForm">
                    <v-text-field v-model="lastName" label="Last Name" required></v-text-field>
                    <v-text-field v-model="phoneNumber" label="Phone Number" required></v-text-field>
                    <v-btn color="primary" @click="goToPinSetup">Next</v-btn>
                </v-form>
            </v-card-text>

            <v-card-text v-if="step === 3">
                <v-text-field v-model="pin" label="Set PIN" type="password" required></v-text-field>
                <v-btn color="primary" @click="submitData">Submit</v-btn>
            </v-card-text>

            <v-card-text v-if="step === 4">
                <v-text-field v-model="enteredPin" label="Enter PIN" type="password" required></v-text-field>
                <v-btn color="primary" @click="verifyPin">Verify</v-btn>
            </v-card-text>

            <!-- Selective Disclosure UI -->
            <v-card-text v-if="step === 5">
                <h3>Select attributes to share</h3>
                <v-list>
                    <v-list-item v-for="(value, key) in jsonData" :key="key">
                        <v-checkbox v-model="selectedAttributes" :value="key" :label="`${key}: ${value}`"></v-checkbox>
                    </v-list-item>
                </v-list>
                <v-btn color="primary" @click="shareSelected">Share Selected</v-btn>               
            </v-card-text>            
        </v-card>
    </v-container>
</template>


<script>
import GlobalLoader from './LoaderComponent.vue';
import QrScanner from 'qr-scanner';
import config from '@/config';
import { useImageStore } from '@/stores/ImageStore';
import { ref } from "vue";
export default {   
    name: 'CameraComponent',
    components: { GlobalLoader },
    data() {
        return {
            imageStore: useImageStore(), // ✅ Initialize the store in data
            stream: null,
            isLoading: false,
            isCameraActive: false,
            isScanning: false,
            step: 1,
            lastName: '',
            phoneNumber: '',
            pin: '',
            qrData: {},
            enteredPin: '',           
            vcID:'',
            faceData:'',
            jsonData: null, // Holds JSON data after verification
            selectedAttributes: [], // Stores selected attributes
            dialog: false, // Controls dialog visibility
            sharedData: {}, // Holds selected data to display  
            ws: null                       
        };
    },
    mounted() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera access is not supported in this browser.");
    }

    // Initialize WebSocket connection
    this.ws = new WebSocket(config.websocketUrl);

    this.ws.onopen = () => {
        console.log("WebSocket connection established.");
    };

    this.ws.onmessage = (event) => {
        console.log("Message received:", event.data);
        // Handle received messages
    };

    this.ws.onclose = () => {
        console.log("WebSocket connection closed.");
    };

    this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
    };    
},
    methods: {
     
        async startCamera() {
    this.isLoading = true;
    try {
        this.stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" }
        });
        this.$refs.cameraFeed.srcObject = this.stream;
        this.isCameraActive = true;
    } catch (error) {
        alert("Failed to access camera. Please check permissions.");
        console.error('Error accessing the camera', error);
    } finally {
        this.isLoading = false;
    }
},
        async scanQRCode() {
    this.isScanning = true;
    this.isLoading = true;
    try {
        this.stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });
        this.$refs.cameraFeed.srcObject = this.stream;
        this.qrScanner = new QrScanner(this.$refs.cameraFeed, result => {
            console.log(result)
            this.qrData = result;
            this.stopCamera();
            this.step = 4;
        });
        this.qrScanner.start();
    } catch (error) {
        console.error('Error starting QR Scanner', error);
    } finally {
        this.isLoading = false;
    }
},
stopCamera() {
    if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.$refs.cameraFeed.srcObject = null;
        this.stream = null;
        this.isCameraActive = false;
        this.isScanning = false;
    }
    if (this.qrScanner) {
        this.qrScanner.destroy();
        this.qrScanner = null;
    }
},
captureImage() {
    try {
        const video = this.$refs.cameraFeed;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        this.faceData = canvas.toDataURL('image/jpeg');
        this.stopCamera();
        this.step = 2;
    } catch (e) {
        alert(e.message);
    }
},
        goToPinSetup() {
            if (this.lastName && this.phoneNumber) {
                this.step = 3;
            } else {
                alert('Please fill out all fields');
            }
        },
        async submitData() {
            try{
            if (!this.pin) {
                alert('Please set a PIN');
                return;
            }            
            const payload ={
                lastName: this.lastName,
                phoneNumber: this.phoneNumber,
                faceData:this.faceData
            }
            const url = config.subdomain + "/api/v1/credential/issue";
    const body = {
      schemaId: config.schemaID,
      subjectDid: config.subDid,
      issuerDid: "did:hid:testnet:036d6edb-d4ae-4df5-9369-d5ff5598061e",
      expirationDate: "2027-12-10T18:30:00.000Z",
      fields: payload,
      namespace: "testnet",
      verificationMethodId: "did:hid:testnet:036d6edb-d4ae-4df5-9369-d5ff5598061e#key-1",
      persist: true,
      registerCredentialMethod: true,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.authToken,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("Credential issued:", data.credentialDocument.id);
    const userData = {
                pin: this.pin,
                lastName: this.lastName,
                phoneNumber: this.phoneNumber,
                did: config.subDid,
                faceData:this.faceData,
                vcID:data.credentialDocument.id
            }
            let storedUsers = JSON.parse(localStorage.getItem("userPins")) || [];

// Add new user data to the array
storedUsers.push(userData);

// Save updated array back to localStorage
localStorage.setItem("userPins", JSON.stringify(storedUsers));    
    this.step = 1;    
    this.pin='',
    this.lastName='',
    this.phoneNumber='',
    this.faceData=''
  } catch (error) {
    console.error("Error issuing credential:", error);
    throw error;
  }     
        },
        async verifyPin() {
    const storedUsers = JSON.parse(localStorage.getItem('userPins')) || [];

    if (storedUsers.length === 0) {
        alert("No PIN found, please set a PIN first.");
        return;
    }

    // Find the user with the entered PIN
    const matchedUser = storedUsers.find(user => user.pin === this.enteredPin);

    if (!matchedUser) {
        alert("Incorrect PIN");
        return;
    }

    console.log("User verified:", matchedUser);

    const url = `${config.subdomain}/api/v1/credential/${matchedUser.vcID}?retrieveCredential=true`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.authToken}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched credential:", data);

        // Store fetched data in UI
        this.jsonData = {
            name: data.credentialDocument.credentialSubject.lastName,
            nationalID: "2823921212",
            birthDate: "1990-01-01",
            phoneNumber: data.credentialDocument.credentialSubject.phoneNumber,
            address: "123 Street, City LA"
        };

        this.step = 5; // Move to selective disclosure UI

    } catch (error) {
        console.error("Error fetching credential:", error);
        alert("Failed to fetch credential. Please try again.");
    }
},
shareSelected() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const sharedData = {};
                this.selectedAttributes.forEach(attr => {
                    sharedData[attr] = this.jsonData[attr];
                });
                console.log(JSON.parse(this.qrData))                
                this.ws.send(JSON.stringify({type:"shareData",payload:sharedData, clientId:JSON.parse(this.qrData).clientId}));
                console.log("Shared data via WebSocket:", sharedData);              
                this.step = 1


            } else {
                console.error("WebSocket is not connected.");
            }
    }}
};
</script>

<style scoped>
.camera-view {
    width: 100%;
    max-width: 350px;
    max-height: 350px;
    object-fit: cover;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.scanner-overlay {
    position: absolute;
    width: 250px;
    height: 150px;
    border: 4px solid #4caf50;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: scan-animation 2s infinite;
}

@keyframes scan-animation {
    0% { box-shadow: 0 0 10px rgba(0, 255, 0, 0.5); }
    50% { box-shadow: 0 0 15px rgba(0, 255, 0, 0.8); }
    100% { box-shadow: 0 0 10px rgba(0, 255, 0, 0.5); }
}
</style>
