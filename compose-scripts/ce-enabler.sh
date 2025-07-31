SOURCE_FOLDER=/app/$TENANT/custom-entities/drops
DEST_FOLDER=/app/$TENANT/custom-entities/definitions
while true; do
    if [ ! -d $SOURCE_FOLDER ]; then
        echo "No source folder found at: $SOURCE_FOLDER"
        sleep 30
        continue
    fi
    if [ ! -d $DEST_FOLDER ]; then
        mkdir -p $DEST_FOLDER
    fi
    filesInDropFolder=($(ls $SOURCE_FOLDER))
    if [ ${#filesInDropFolder[@]} -eq 0 ]; then
        echo "No file(s) found in: $SOURCE_FOLDER. Skipping"
    else
        echo "Copying from $SOURCE_FOLDER to $DEST_FOLDER"
        mv $SOURCE_FOLDER/* $DEST_FOLDER/
        echo "Copy done!"
    fi
    sleep 30
done