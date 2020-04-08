
import React, { Component } from 'react';
import { FilePond, File, registerPlugin } from 'react-filepond';
import firebase from 'firebase';
import StorageDataTable from './components/StorageDataTable';

import './App.css';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';

// Register plugin
import FilePondImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
registerPlugin(FilePondImagePreview);

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            files: [], //File Upload
            uploadValue: 0, //Process Upload
            filesMetadata:[], //Metadata Firebase
            rows:  [], //DataTable
        };

        // Initialize Firebase
        var config = {
            apiKey: "AIzaSyBZAq8Q5FpHFeadnX0gqZDRVztiJd1ON4A",
            authDomain: "arpath-2020.firebaseapp.com",
            databaseURL: "https://arpath-2020.firebaseio.com",
            projectId: "arpath-2020",
            storageBucket: "arpath-2020.appspot.com",
            messagingSenderId: "100644333312"
        };
        firebase.initializeApp(config);

    }

    //Mount DOM
    componentWillMount() {
        this.getMetaDataFromDatabase()
    }

    //Metadata Firebase
    getMetaDataFromDatabase () {
        console.log("getMetaDataFromDatabase");
        const databaseRef = firebase.database().ref('/files');

        databaseRef.on('value', snapshot => {
            this.setState({
                filesMetadata:snapshot.val()
            }, () => {
                this.addMetadataToList()
            });
        });
    }

    //Metada Firebase
    deleteMetaDataFromDatabase(e,rowData){

        const storageRef = firebase.storage().ref(`files/${rowData.name}`);

        // Delete the file on storage
        storageRef.delete()
        .then(() => {
            console.log("Delete file success");

            let databaseRef = firebase.database().ref('/files');

            // Delete the file on realtime database
            databaseRef.child(rowData.key).remove()
            .then(() => {
                console.log("Delete metada success");
                this.getMetaDataFromDatabase()
            })
            .catch((error) => {
                console.log("Delete metada error : ", error.message);
            });

        })
        
        .catch((error) => {
            console.log("Delete file error : " , error.message);
        });
 
    
    }
    
    //list table
    addMetadataToList() {
        let i = 1;
        let rows = [];
        
        //Loop add data to rows
        for (let key in this.state.filesMetadata) {
              
            let fileData = this.state.filesMetadata[key];

            let objRows =  { 
                no:i++, 
                key:key, //Delete
                name: fileData.metadataFile.name, 
                downloadURLs: fileData.metadataFile.downloadURLs, 
                fullPath: fileData.metadataFile.fullPath,
                size:(fileData.metadataFile.size),
                contentType:fileData.metadataFile.contentType,
                target: fileData.metadataFile.target,
            }

            rows.push(objRows)
        }

        this.setState({
            rows: rows
        }, () => {
            console.log('Set Rows')
        })

    }
    
    handleInit() {
         // handle init file upload here
        console.log('now initialised', this.pond);
    }

    handleProcessing(fieldName, file, metadata, load, error, progress, abort) {
        // handle file upload here
        console.log(" handle file upload here");
        console.log(file);

        const fileUpload = file;
        const storageRef = firebase.storage().ref(`files/${file.name}`);
        const task = storageRef.put(fileUpload)

        task.on(`state_changed` , (snapshort) => {
            console.log(snapshort.bytesTransferred, snapshort.totalBytes)
            let percentage = (snapshort.bytesTransferred / snapshort.totalBytes) * 100;
            //Process
            this.setState({
                uploadValue:percentage
            })
        } , (error) => {
            //Error
            this.setState({
                messag:`Upload error : ${error.message}`
            })
        } , () => {
            //Success
            this.setState({
                messag:`Upload Success`,
                picture: task.snapshot.downloadURL //Upload
            })

            console.log(this.state.messag)
            storageRef.getMetadata().then((metadata) => {
                // Metadata now contains the metadata for 'files/${file.name}'
                let metadataFile = { 
                    name: metadata.name, 
                    size: metadata.size, 
                    contentType: metadata.contentType, 
                    fullPath: metadata.fullPath, 
                    downloadURLs: metadata.downloadURLs[0], 
                    target: 'Target' + Math.floor(Math.random() * (10 - 0)),
                }

                const databaseRef = firebase.database().ref('/files');

                databaseRef.push({
                    metadataFile
                  });

              }).catch(function(error) {
                this.setState({
                    messag:`Upload error : ${error.message}`
                })
              });
        })
    }

    render() {
        const { rows, filesMetadata } = this.state;
        return (
            <div className="App">
                <div className="Margin-25">
                    <FilePond 
                            files={this.state.files}
                            ref= {ref => this.pond = ref}
                            allowMultiple={false}
                            maxFiles={1}
                            instantUpload={true}
                            server={{ process: this.handleProcessing.bind(this) }}
                            oninit={() => this.handleInit()}
                            onupdatefiles={fileItems => {
                                this.setState({
                                    files: fileItems.map(fileItem => fileItem.file)
                                })
                            }}
                        >
                        
                        {this.state.files.map(file => (
                            <File key={file} source={file}/>
                        ))}
                        
                    </FilePond>

                    <StorageDataTable
                        rows={rows}
                        filesMetadata={filesMetadata}
                        deleteData={this.deleteMetaDataFromDatabase}
                    />
                </div>
            </div>
        );
    }
}

export default App;