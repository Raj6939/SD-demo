import { defineStore } from 'pinia';
import config from '@/config';
export const useImageStore = defineStore('imageStore', {
    state: () => ({
        image: null, // Reactive without using ref        
    }),
    getters: {
        getImage: (state) => state.image, // Better name to avoid confusion
        getEntityHeader: (state) => {
            return {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + state.accessToken,              
            };
        },
    },
    actions: {
        setImage(image) {
            this.image = image; // Update state directly
        },
        async detectFaceFromImage() {
            try {
                console.log('Detecting face from image...');
                console.log('Image:', this.image);

                const embedding = this.image
                // Simulate face detection logic
                // Example simulated delay
                const response = await fetch(config.backendURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ embedding }),
                });

                if (!response.ok) {
                    throw new Error('Failed to detect face');
                }

                const data = await response.json();
                console.log('Face detection result:', data);
                return data;
            } catch (error) {
                console.error('Error detecting face:', error);
            }
        },
        issueCredential: ({ state,getters, commit }, payload) => {
            console.log(payload)       
            return new Promise((resolve, reject) => {
              try {
                const url = config.subdomain + "/api/v1/credential/issue";
                const body = {
                  schemaId:config.schemaID,
                  subjectDid: config.subDid,
                  issuerDid:"did:hid:testnet:036d6edb-d4ae-4df5-9369-d5ff5598061e",
                  expirationDate: "2027-12-10T18:30:00.000Z",
                  fields: payload,
                  namespace: "testnet",
                  verificationMethodId:"did:hid:testnet:036d6edb-d4ae-4df5-9369-d5ff5598061e#key-1",
                  persist: true,
                  registerCredentialMethod:true
                };
                fetch(url, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + config.authToken,              
                  } ,
                  body: JSON.stringify(body),
                })
                  .then((resp) => {
                    return resp.json();
                  })
                  .then((json) => {
                    if (json.statusCode == 400) {
                      throw new Error("Bad Request" + json.message.toString());
                    }                    
                    commit("setVCToStore",json.credentialDocument)
                    resolve(json);
                  });
              } catch (error) {
                reject(error);
              }
            });
          },
        async updateData(body) {
            // call patch endpoint for updating
            try {
                const response = await fetch(config.backendURL, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    throw new Error('Failed to update data');
                }

                const data = await response.json();
                console.log('Update result:', data);
                return data;
            } catch (error) {
                console.error('Error updating data:', error);
            }

        }
    }
});
