import config from '@/config';
import { defineStore } from 'pinia';

export const useImageStore = defineStore('imageStore', {
    state: () => ({
        image: null, // Reactive without using ref
    }),
    getters: {
        getImage: (state) => state.image, // Better name to avoid confusion
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
