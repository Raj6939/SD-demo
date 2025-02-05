<script>
import { mapActions, mapState } from 'pinia';
import CameraComponent from './components/CameraComponent.vue'
import {
  useImageStore
} from './stores/ImageStore'
import FormComponent from './components/FormComponent.vue';

export default {
  components: { CameraComponent, FormComponent, },
  computed: {
    ...mapState(useImageStore, ['image', 'getImage'])
  },

  data() {
    return {
      image: null, // The captured image
      isLoading: false, // Global loading state
      showForm: true,
      id: '',
      data: {
      }
    };
  },
  //  listen for the imageCaptured event from the CameraComponent and display the image
  methods: {
    ...mapActions(useImageStore, ['setImage', 'detectFaceFromImage', 'updateData']),

    async handleImageCapture(image) {
      this.isLoading = true;
      try {
        // Display the image
        this.image = image;
        this.setImage(image);
        const resp = await this.detectFaceFromImage();
        this.showForm = resp.exists
        this.id = resp.id
        this.data = resp



      } catch (error) {
        console.error('Error displaying the image', error);
      } finally {
        this.isLoading = false;
      }
    },

    handleFormSubmit(formData) {
      this.updateData({
        id: this.id, ...formData,
        embedding: this.image
      })



      // Handle the form data as needed
    },
  },
}
</script>

<template>
  <camera-component @image-captured="handleImageCapture" />
  <form-component v-if="!showForm" @formSubmitted="handleFormSubmit" />
  <v-container v-if="data.id !== undefined">

    <textarea rows="100" cols="70">
    {{ JSON.stringify(this.data, null, 2) }}
  </textarea>
  </v-container>


</template>

<style scoped></style>
