import os
import zipfile

def create_zip(file_list):
    """
    Compress a list of files into a zip archive.
    
    Args:
        file_list: List of file paths to compress
        output_zip: Name of the output zip file
    """
    output_zip = input("What is the name of this release? ") + '.zip';
    with zipfile.ZipFile('releases/' + output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in file_list:
            if os.path.exists(file_path):
                # Add file to zip, using just the filename (not full path)
                zipf.write(file_path, os.path.basename(file_path))
                print("Added: {}".format(file_path))
            else:
                print("Warning: {} not found, skipping".format(file_path))
    
    print("\nZip file created: {}".format(output_zip))

# Example usage:
files_to_compress = [
    'licence.txt',
    'interface.js',
    'interface2.js',
    'interface3.js',
    'nectarvore_audioTrackRouter.amxd',
    'nectarvore.amxd',
    'nectarvore.js',
    'printWithTiming.js',
    'record_button.jpg',
    'sampPlayback.maxpat'
]

create_zip(files_to_compress)