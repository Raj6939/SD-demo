<template>
    <v-container>
        <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field v-model="name" :rules="nameRules" label="Name" required></v-text-field>

            <v-text-field v-model="age" :rules="ageRules" label="Age" required></v-text-field>

            <v-text-field v-model="email" :rules="emailRules" label="E-mail" required></v-text-field>

            <v-btn :disabled="!valid" color="success" @click="submit">
                Submit
            </v-btn>
        </v-form>
    </v-container>
</template>

<script>
export default {
    data() {
        return {
            valid: false,
            name: '',
            age: '',
            email: '',
            nameRules: [
                v => !!v || 'Name is required',
                v => (v && v.length <= 10) || 'Name must be less than 10 characters',
            ],
            ageRules: [
                v => !!v || 'Age is required',
                v => (v && !isNaN(v) && v > 0) || 'Age must be a positive number',
            ],
            emailRules: [
                v => !!v || 'E-mail is required',
                v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
            ],
        };
    },
    methods: {
        submit() {
            if (this.$refs.form.validate()) {
                // Emit form data to parent component
                this.$emit('formSubmitted', {
                    name: this.name,
                    age: this.age,
                    email: this.email
                });
            }
        },
    },
};
</script>

<style scoped></style>