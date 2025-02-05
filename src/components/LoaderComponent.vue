<template>
    <v-overlay v-if="isLoading" absolute opacity="0.8">
        <v-progress-circular indeterminate size="70" color="primary" />
    </v-overlay>
</template>

<script>
export default {
    props: {
        isLoading: {
            type: Boolean,
            required: true,
        },
    },
};
</script>

<style scoped>
/* The overlay will cover the entire screen */
v-overlay {
    z-index: 9999;
    /* Ensure the loader appears above all other content */
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    position: fixed;
    /* Fix the overlay to cover the entire page */
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    /* Semi-transparent background */
}

/* You can customize the size of the progress circular if needed */
v-progress-circular {
    color: #1976d2;
    /* Change the color to match your design (use primary or any color) */
}
</style>
