cd ~/code/who-data
# download
R -e 'devtools::load_all(".", export_all = FALSE); whodata::download_who_data()'
# rename
rename 's/_k15_d250//g' * 
rename 's/act/activity/g' *
rename 's/res/residential/g' *
# move to
cp * ~/code/activeTransportToolbox/data-intermediate/flows/accra